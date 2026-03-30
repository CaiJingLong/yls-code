pub mod app_state;
pub mod db;
pub mod models;

use anyhow::{Context, Result};
use tauri::Manager;

use app_state::AppState;

fn initialize_app_state(app_handle: &tauri::AppHandle) -> Result<AppState> {
    let data_dir = app_handle
        .path()
        .app_local_data_dir()
        .context("failed to resolve app local data directory")?;
    let db_path = db::bootstrap_database_at(&data_dir)?;

    Ok(AppState::new(db_path))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let state = initialize_app_state(app.handle())?;
            app.manage(state);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
