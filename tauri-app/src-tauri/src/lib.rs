pub mod app_state;
pub mod commands;
pub mod db;
pub mod models;
pub mod services;

use anyhow::{Context, Result};
use tauri::Manager;

use app_state::AppState;
use services::secret_store::KeychainSecretStore;

fn initialize_app_state(app_handle: &tauri::AppHandle) -> Result<AppState> {
    let data_dir = app_handle
        .path()
        .app_local_data_dir()
        .context("failed to resolve app local data directory")?;
    let db_path = db::bootstrap_database_at(&data_dir)?;
    let secret_store = std::sync::Arc::new(KeychainSecretStore::new("com.yls.workbench.api-key"));

    Ok(AppState::new(db_path, secret_store))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::accounts::delete_account,
            commands::accounts::list_accounts,
            commands::accounts::save_account,
            commands::accounts::set_account_enabled,
        ])
        .setup(|app| {
            let state = initialize_app_state(app.handle())?;
            app.manage(state);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
