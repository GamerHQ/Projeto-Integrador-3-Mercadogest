use deadpool_postgres::{Config, Pool, Runtime};
use tokio_postgres::NoTls;
use crate::config::carregar_database_url;

pub fn criar_pool() -> Pool {
    let url = carregar_database_url();

    // Parseia a URL no formato postgresql://user:senha@host:porta/banco
    let mut cfg = Config::new();

    let url = url.replace("postgresql://", "").replace("postgres://", "");
    let at_pos = url.rfind('@').unwrap_or(0);
    let credenciais = &url[..at_pos];
    let resto = &url[at_pos + 1..];

    let cred_parts: Vec<&str> = credenciais.splitn(2, ':').collect();
    if cred_parts.len() == 2 {
        cfg.user = Some(cred_parts[0].to_string());
        cfg.password = Some(cred_parts[1].to_string());
    }

    let slash_pos = resto.find('/').unwrap_or(resto.len());
    let host_porta = &resto[..slash_pos];
    let banco = &resto[slash_pos + 1..];

    let host_parts: Vec<&str> = host_porta.splitn(2, ':').collect();
    cfg.host = Some(host_parts[0].to_string());
    if host_parts.len() == 2 {
        cfg.port = host_parts[1].parse().ok();
    }

    cfg.dbname = Some(banco.to_string());
    cfg.pool = Some(deadpool_postgres::PoolConfig::new(10));

    cfg.create_pool(Some(Runtime::Tokio1), NoTls)
        .expect("Erro ao criar pool de conexoes")
}