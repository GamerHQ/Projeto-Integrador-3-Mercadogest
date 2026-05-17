use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Categoria {
    pub id: i32,
    pub nome: String,
    pub emoji: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Produto {
    pub id: i32,
    pub nome: String,
    pub codigo_barras: Option<String>,
    pub categoria_id: Option<i32>,
    pub categoria_nome: Option<String>,
    pub categoria_emoji: Option<String>,
    pub unidade: String,
    pub custo: f64,
    pub preco_venda: f64,
    pub estoque_atual: f64,
    pub estoque_minimo: f64,
    pub estoque_maximo: f64,
    pub ativo: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NovoProduto {
    pub nome: String,
    pub codigo_barras: Option<String>,
    pub categoria_id: Option<i32>,
    pub unidade: String,
    pub custo: f64,
    pub preco_venda: f64,
    pub estoque_atual: f64,
    pub estoque_minimo: f64,
    pub estoque_maximo: f64,
    pub validade: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ItemVenda {
    pub produto_id: i32,
    pub quantidade: f64,
    pub preco_unit: f64,
    pub subtotal: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NovaVenda {
    pub itens: Vec<ItemVenda>,
    pub total: f64,
    pub desconto: f64,
    pub forma_pagamento: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Venda {
    pub id: i32,
    pub total: f64,
    pub desconto: f64,
    pub forma_pagamento: String,
    pub status: String,
    pub criado_em: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VendaItem {
    pub id: i32,
    pub venda_id: i32,
    pub produto_id: i32,
    pub produto_nome: String,
    pub quantidade: f64,
    pub preco_unit: f64,
    pub subtotal: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NovoLancamento {
    pub tipo: String, // "entrada" ou "saida"
    pub descricao: String,
    pub valor: f64,
    pub categoria: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Lancamento {
    pub id: i32,
    pub tipo: String,
    pub descricao: String,
    pub valor: f64,
    pub categoria: Option<String>,
    pub criado_em: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ResumoFinanceiro {
    pub receita_bruta: f64,
    pub gastos: f64,
    pub lucro: f64,
    pub total_vendas: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DashboardKpis {
    pub receita_hoje: f64,
    pub gastos_hoje: f64,
    pub lucro_hoje: f64,
    pub vendas_hoje: i64,
    pub receita_mes: f64,
    pub gastos_mes: f64,
    pub lucro_mes: f64,
    pub vendas_mes: i64,
    pub produtos_criticos: i64,
    pub produtos_baixo: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GraficoDia {
    pub dia: String,
    pub receita: f64,
    pub gasto: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TopProduto {
    pub nome: String,
    pub total: f64,
    pub quantidade: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PagamentoPorTipo {
    pub forma: String,
    pub total: f64,
    pub percentual: f64,
}
