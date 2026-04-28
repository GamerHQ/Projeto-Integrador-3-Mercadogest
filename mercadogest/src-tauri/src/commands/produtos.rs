use tauri::command;
use tauri::State;
use crate::AppState;
use crate::models::{Produto, NovoProduto, Categoria};

#[command]
pub async fn listar_produtos(state: State<'_, AppState>) -> Result<Vec<Produto>, String> {
    let client = state.pool.get().await.map_err(|e| e.to_string())?;

    let rows = client.query(
        "SELECT p.id, p.nome, p.codigo_barras, p.categoria_id,
                c.nome, c.emoji, p.unidade,
                p.custo::float8, p.preco_venda::float8,
                p.estoque_atual::float8, p.estoque_minimo::float8,
                p.estoque_maximo::float8,
                TO_CHAR(p.validade, 'DD/MM/YYYY'),
                p.ativo
         FROM produtos p
         LEFT JOIN categorias c ON c.id = p.categoria_id
         WHERE p.ativo = true ORDER BY p.nome",
        &[],
    ).await.map_err(|e| e.to_string())?;

    Ok(rows.iter().map(|r| Produto {
        id: r.get(0), nome: r.get(1), codigo_barras: r.get(2),
        categoria_id: r.get(3), categoria_nome: r.get(4),
        categoria_emoji: r.get(5), unidade: r.get(6),
        custo: r.get(7), preco_venda: r.get(8),
        estoque_atual: r.get(9), estoque_minimo: r.get(10),
        estoque_maximo: r.get(11), validade: r.get(12), ativo: r.get(13),
    }).collect())
}

#[command]
pub async fn listar_categorias(state: State<'_, AppState>) -> Result<Vec<Categoria>, String> {
    let client = state.pool.get().await.map_err(|e| e.to_string())?;
    let rows = client.query(
        "SELECT id, nome, emoji FROM categorias ORDER BY nome", &[],
    ).await.map_err(|e| e.to_string())?;

    Ok(rows.iter().map(|r| Categoria {
        id: r.get(0), nome: r.get(1), emoji: r.get(2),
    }).collect())
}

#[command]
pub async fn criar_produto(state: State<'_, AppState>, produto: NovoProduto) -> Result<bool, String> {
    let client = state.pool.get().await.map_err(|e| e.to_string())?;
    client.execute(
        "INSERT INTO produtos
            (nome, codigo_barras, categoria_id, unidade, custo, preco_venda,
             estoque_atual, estoque_minimo, estoque_maximo, validade)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TO_DATE($10,'DD/MM/YYYY'))",
        &[
            &produto.nome, &produto.codigo_barras, &produto.categoria_id,
            &produto.unidade, &produto.custo, &produto.preco_venda,
            &produto.estoque_atual, &produto.estoque_minimo,
            &produto.estoque_maximo, &produto.validade,
        ],
    ).await.map_err(|e| e.to_string())?;
    Ok(true)
}

#[command]
pub async fn atualizar_produto(state: State<'_, AppState>, id: i32, produto: NovoProduto) -> Result<bool, String> {
    let client = state.pool.get().await.map_err(|e| e.to_string())?;
    client.execute(
        "UPDATE produtos SET nome=$1, codigo_barras=$2, categoria_id=$3,
         unidade=$4, custo=$5, preco_venda=$6, estoque_atual=$7,
         estoque_minimo=$8, estoque_maximo=$9,
         validade=TO_DATE($10,'DD/MM/YYYY') WHERE id=$11",
        &[
            &produto.nome, &produto.codigo_barras, &produto.categoria_id,
            &produto.unidade, &produto.custo, &produto.preco_venda,
            &produto.estoque_atual, &produto.estoque_minimo,
            &produto.estoque_maximo, &produto.validade, &id,
        ],
    ).await.map_err(|e| e.to_string())?;
    Ok(true)
}

#[command]
pub async fn excluir_produto(state: State<'_, AppState>, id: i32) -> Result<bool, String> {
    let client = state.pool.get().await.map_err(|e| e.to_string())?;
    client.execute(
        "UPDATE produtos SET ativo = false WHERE id = $1", &[&id],
    ).await.map_err(|e| e.to_string())?;
    Ok(true)
}

#[command]
pub async fn atualizar_estoque(state: State<'_, AppState>, produto_id: i32, quantidade: f64) -> Result<bool, String> {
    let client = state.pool.get().await.map_err(|e| e.to_string())?;
    client.execute(
        "UPDATE produtos SET estoque_atual = estoque_atual + $1 WHERE id = $2",
        &[&quantidade, &produto_id],
    ).await.map_err(|e| e.to_string())?;
    Ok(true)
}