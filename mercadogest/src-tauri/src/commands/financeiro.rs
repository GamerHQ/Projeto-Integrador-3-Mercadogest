use tauri::command;
use tauri::State;
use crate::AppState;
use crate::models::{
    Lancamento, NovoLancamento, DashboardKpis,
    GraficoDia, TopProduto, PagamentoPorTipo,
};

#[command]
pub async fn listar_lancamentos(
    state: State<'_, AppState>,
    limite: i64,
) -> Result<Vec<Lancamento>, String> {
    let client = state.pool.get().await.map_err(|e| e.to_string())?;

    let rows = client.query(
        "SELECT id, tipo, descricao, valor::float8, categoria,
                TO_CHAR(criado_em, 'DD/MM/YYYY HH24:MI') as criado_em
         FROM financeiro
         ORDER BY criado_em DESC
         LIMIT $1",
        &[&limite],
    ).await.map_err(|e| e.to_string())?;

    Ok(rows.iter().map(|r| Lancamento {
        id:        r.get(0),
        tipo:      r.get(1),
        descricao: r.get(2),
        valor:     r.get(3),
        categoria: r.get(4),
        criado_em: r.get(5),
    }).collect())
}

#[command]
pub async fn criar_lancamento(
    state: State<'_, AppState>,
    lancamento: NovoLancamento,
) -> Result<bool, String> {
    let client = state.pool.get().await.map_err(|e| e.to_string())?;

    client.execute(
        "INSERT INTO financeiro (tipo, descricao, valor, categoria)
         VALUES ($1, $2, $3, $4)",
        &[
            &lancamento.tipo,
            &lancamento.descricao,
            &lancamento.valor,
            &lancamento.categoria,
        ],
    ).await.map_err(|e| e.to_string())?;

    Ok(true)
}

#[command]
pub async fn buscar_kpis_dashboard(
    state: State<'_, AppState>,
) -> Result<DashboardKpis, String> {
    let client = state.pool.get().await.map_err(|e| e.to_string())?;

    // KPIs de hoje
    let hoje = client.query_one(
        "SELECT
            COALESCE(SUM(CASE WHEN tipo='entrada' THEN valor ELSE 0 END), 0)::float8,
            COALESCE(SUM(CASE WHEN tipo='saida'   THEN valor ELSE 0 END), 0)::float8
         FROM financeiro
         WHERE DATE(criado_em) = CURRENT_DATE",
        &[],
    ).await.map_err(|e| e.to_string())?;

    let receita_hoje: f64 = hoje.get(0);
    let gastos_hoje:  f64 = hoje.get(1);

    // Total de vendas hoje
    let vendas_hoje_row = client.query_one(
        "SELECT COUNT(*)::bigint FROM vendas
         WHERE DATE(criado_em) = CURRENT_DATE",
        &[],
    ).await.map_err(|e| e.to_string())?;
    let vendas_hoje: i64 = vendas_hoje_row.get(0);

    // KPIs do mes
    let mes = client.query_one(
        "SELECT
            COALESCE(SUM(CASE WHEN tipo='entrada' THEN valor ELSE 0 END), 0)::float8,
            COALESCE(SUM(CASE WHEN tipo='saida'   THEN valor ELSE 0 END), 0)::float8
         FROM financeiro
         WHERE DATE_TRUNC('month', criado_em) = DATE_TRUNC('month', CURRENT_DATE)",
        &[],
    ).await.map_err(|e| e.to_string())?;

    let receita_mes: f64 = mes.get(0);
    let gastos_mes:  f64 = mes.get(1);

    // Total de vendas do mes
    let vendas_mes_row = client.query_one(
        "SELECT COUNT(*)::bigint FROM vendas
         WHERE DATE_TRUNC('month', criado_em) = DATE_TRUNC('month', CURRENT_DATE)",
        &[],
    ).await.map_err(|e| e.to_string())?;
    let vendas_mes: i64 = vendas_mes_row.get(0);

    // Alertas de estoque
    let estoque = client.query_one(
        "SELECT
            COUNT(CASE WHEN estoque_atual <= 0
                            OR estoque_atual < estoque_minimo * 0.3
                       THEN 1 END)::bigint as criticos,
            COUNT(CASE WHEN estoque_atual < estoque_minimo
                            AND estoque_atual >= estoque_minimo * 0.3
                       THEN 1 END)::bigint as baixos
         FROM produtos WHERE ativo = true",
        &[],
    ).await.map_err(|e| e.to_string())?;

    Ok(DashboardKpis {
        receita_hoje,
        gastos_hoje,
        lucro_hoje:        receita_hoje - gastos_hoje,
        vendas_hoje,
        receita_mes,
        gastos_mes,
        lucro_mes:         receita_mes - gastos_mes,
        vendas_mes,
        produtos_criticos: estoque.get(0),
        produtos_baixo:    estoque.get(1),
    })
}

#[command]
pub async fn grafico_7_dias(
    state: State<'_, AppState>,
) -> Result<Vec<GraficoDia>, String> {
    let client = state.pool.get().await.map_err(|e| e.to_string())?;

    let rows = client.query(
        "SELECT
            TO_CHAR(dia, 'DD/MM') as dia,
            COALESCE(SUM(CASE WHEN f.tipo='entrada' THEN f.valor ELSE 0 END), 0)::float8 as receita,
            COALESCE(SUM(CASE WHEN f.tipo='saida'   THEN f.valor ELSE 0 END), 0)::float8 as gasto
         FROM generate_series(
            CURRENT_DATE - INTERVAL '6 days',
            CURRENT_DATE,
            '1 day'::interval
         ) AS dia
         LEFT JOIN financeiro f ON DATE(f.criado_em) = dia
         GROUP BY dia
         ORDER BY dia",
        &[],
    ).await.map_err(|e| e.to_string())?;

    Ok(rows.iter().map(|r| GraficoDia {
        dia:     r.get(0),
        receita: r.get(1),
        gasto:   r.get(2),
    }).collect())
}

#[command]
pub async fn top_produtos(
    state: State<'_, AppState>,
    limite: i64,
) -> Result<Vec<TopProduto>, String> {
    let client = state.pool.get().await.map_err(|e| e.to_string())?;

    let rows = client.query(
        "SELECT p.nome,
                SUM(vi.subtotal)::float8  as total,
                SUM(vi.quantidade)::float8 as quantidade
         FROM venda_itens vi
         JOIN produtos p ON p.id = vi.produto_id
         JOIN vendas v    ON v.id = vi.venda_id
         WHERE DATE_TRUNC('month', v.criado_em) = DATE_TRUNC('month', CURRENT_DATE)
         GROUP BY p.id, p.nome
         ORDER BY total DESC
         LIMIT $1",
        &[&limite],
    ).await.map_err(|e| e.to_string())?;

    Ok(rows.iter().map(|r| TopProduto {
        nome:       r.get(0),
        total:      r.get(1),
        quantidade: r.get(2),
    }).collect())
}

#[command]
pub async fn pagamentos_por_tipo(
    state: State<'_, AppState>,
) -> Result<Vec<PagamentoPorTipo>, String> {
    let client = state.pool.get().await.map_err(|e| e.to_string())?;

    let rows = client.query(
        "WITH totais AS (
            SELECT SUM(total)::float8 as grand_total
            FROM vendas
            WHERE DATE_TRUNC('month', criado_em) = DATE_TRUNC('month', CURRENT_DATE)
         )
         SELECT
            v.forma_pagamento,
            SUM(v.total)::float8 as total,
            ROUND((SUM(v.total) / NULLIF(t.grand_total, 0) * 100)::numeric, 1)::float8 as pct
         FROM vendas v, totais t
         WHERE DATE_TRUNC('month', v.criado_em) = DATE_TRUNC('month', CURRENT_DATE)
         GROUP BY v.forma_pagamento, t.grand_total
         ORDER BY total DESC",
        &[],
    ).await.map_err(|e| e.to_string())?;

    Ok(rows.iter().map(|r| PagamentoPorTipo {
        forma:      r.get(0),
        total:      r.get(1),
        percentual: r.get(2),
    }).collect())
}