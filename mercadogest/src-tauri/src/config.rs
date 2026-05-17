use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub fn carregar_database_url() -> String {
    // 1. Tenta variável de ambiente do sistema primeiro
    if let Ok(url) = std::env::var("DATABASE_URL") {
        return url;
    }
    let env_paths = [
        PathBuf::from(".env"),
        PathBuf::from("../.env"),
        PathBuf::from("../../.env"),
    ];

    for env_path in &env_paths {
        if env_path.exists() {
            if let Ok(conteudo) = fs::read_to_string(env_path) {
                for linha in conteudo.lines() {
                    if linha.starts_with("DATABASE_URL") {
                        if let Some(url) = linha.splitn(2, '=').nth(1) {
                            return url.trim().trim_matches('"').to_string();
                        }
                    }
                }
            }
        }
    }

    let config_path = executavel_dir().join("config.toml");
    if config_path.exists() {
        if let Ok(conteudo) = fs::read_to_string(&config_path) {
            for linha in conteudo.lines() {
                if linha.starts_with("DATABASE_URL") {
                    if let Some(url) = linha.splitn(2, '=').nth(1) {
                        return url.trim().trim_matches('"').to_string();
                    }
                }
            }
        }
    }


    String::from("DATABASE_URL")
}

#[tauri::command]
fn executavel_dir() -> PathBuf {
    std::env::current_exe()
        .unwrap()
        .parent()
        .unwrap()
        .to_path_buf()
}