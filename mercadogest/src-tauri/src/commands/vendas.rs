use tauri::command;
use tauri::State;
use crate::AppState;
use crate::models::{Venda, NovaVenda};
use rust_decimal::prelude::*;
 
#[command]
pub async fn registrar_venda(state: State<'_, AppState>, venda: NovaVenda) -> Result<bool, String> {
    let mut client = state.pool.get().await.map_err(|e| e.to_string())?;
    
    let total_dec = Decimal::from_f64(venda.total).unwrap_or_default();
    let desconto_dec = Decimal::from_f64(venda.desconto).unwrap_or_default();

    let tx = client.transaction().await.map_err(|e| e.to_string())?;

    let row = tx.query_one(
        "INSERT INTO vendas (total, desconto, forma_pagamento, status) 
         VALUES ($1, $2, $3, 'finalizada') RETURNING id",
        &[&total_dec, &desconto_dec, &venda.forma_pagamento],
    ).await.map_err(|e| e.to_string())?;

    let venda_id: i32 = row.get(0);


    for item in venda.itens {
        let qtd_dec = Decimal::from_f64(item.quantidade).unwrap_or_default();
        let preco_dec = Decimal::from_f64(item.preco_unit).unwrap_or_default();
        let subtotal_dec = Decimal::from_f64(item.subtotal).unwrap_or_default();

        tx.execute(
            "INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unit, subtotal) 
             VALUES ($1, $2, $3, $4, $5)",
            &[&venda_id, &item.produto_id, &qtd_dec, &preco_dec, &subtotal_dec],
        ).await.map_err(|e| e.to_string())?;

        tx.execute(
            "UPDATE produtos SET estoque_atual = estoque_atual - $1 WHERE id = $2",
            &[&qtd_dec, &item.produto_id],
        ).await.map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(true)
}
 
#[command]
pub async fn listar_vendas(
    state: State<'_, AppState>,
    limite: i64,
) -> Result<Vec<Venda>, String> {
    let client = state.pool.get().await.map_err(|e| e.to_string())?;
 
    let rows = client.query(
        "SELECT id, total::float8, desconto::float8, forma_pagamento, status,
                TO_CHAR(criado_em, 'DD/MM/YYYY HH24:MI') as criado_em
         FROM vendas
         ORDER BY criado_em DESC
         LIMIT $1",
        &[&limite],
    ).await.map_err(|e| e.to_string())?;
 
    Ok(rows.iter().map(|r| Venda {
        id:              r.get(0),
        total:           r.get(1),
        desconto:        r.get(2),
        forma_pagamento: r.get(3),
        status:          r.get(4),
        criado_em:       r.get(5),
    }).collect())
}
 