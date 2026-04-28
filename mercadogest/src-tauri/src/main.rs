#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod models;
mod config;

use tauri::Manager;
use db::criar_pool;

pub struct AppState {
    pub pool: deadpool_postgres::Pool,
}


use commands::financeiro::{
    buscar_kpis_dashboard, criar_lancamento, grafico_7_dias, listar_lancamentos,
    pagamentos_por_tipo, top_produtos,
};
use commands::produtos::{
    atualizar_estoque, atualizar_produto, criar_produto, excluir_produto, listar_categorias,
    listar_produtos,
};
use commands::vendas::{listar_vendas, registrar_venda};

fn main() {
    let pool = criar_pool();

    tauri::Builder::default()
        .manage(AppState { pool })
        .setup(|app| {
            #[cfg(debug_assertions)] // só ativa em modo dev
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            // Produtos
            listar_produtos,
            criar_produto,
            atualizar_produto,
            excluir_produto,
            listar_categorias,
            atualizar_estoque,
            // Vendas
            registrar_venda,
            listar_vendas,
            // Financeiro / Dashboard
            listar_lancamentos,
            criar_lancamento,
            buscar_kpis_dashboard,
            grafico_7_dias,
            top_produtos,
            pagamentos_por_tipo,
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar o MercadoGest");
}
