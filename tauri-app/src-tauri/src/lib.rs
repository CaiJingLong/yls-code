pub mod app_state;
pub mod commands;
pub mod db;
pub mod events;
pub mod models;
pub mod services;

use anyhow::{Context, Result};
use rusqlite::{params, Connection};
use tauri::Manager;

use app_state::AppState;

const KEYCHAIN_MIGRATION_META_KEY: &str = "keychain_api_key_migration_done";

#[cfg(target_os = "macos")]
fn load_keychain_api_key(service_name: &str, account_id: &str) -> Result<Option<String>> {
    let entry = keyring::Entry::new(service_name, account_id)
        .with_context(|| format!("failed to create keychain entry for account `{account_id}`"))?;
    match entry.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(error) => Err(error)
            .with_context(|| format!("failed to read keychain API key for account `{account_id}`")),
    }
}

#[cfg(not(target_os = "macos"))]
fn load_keychain_api_key(_service_name: &str, _account_id: &str) -> Result<Option<String>> {
    Ok(None)
}

#[cfg(target_os = "macos")]
fn delete_keychain_api_key(service_name: &str, account_id: &str) -> Result<()> {
    let entry = keyring::Entry::new(service_name, account_id)
        .with_context(|| format!("failed to create keychain entry for account `{account_id}`"))?;
    match entry.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(error).with_context(|| {
            format!("failed to delete keychain API key for account `{account_id}`")
        }),
    }
}

#[cfg(not(target_os = "macos"))]
fn delete_keychain_api_key(_service_name: &str, _account_id: &str) -> Result<()> {
    Ok(())
}

fn run_keychain_api_key_migration(db_path: &std::path::Path) -> Result<()> {
    let connection = Connection::open(db_path)
        .with_context(|| format!("failed to open sqlite database at {}", db_path.display()))?;
    let already_done =
        crate::db::migrations::get_meta_value(&connection, KEYCHAIN_MIGRATION_META_KEY)?
            .is_some_and(|value| value == "1");
    if already_done {
        return Ok(());
    }

    let mut statement = connection.prepare(
        "SELECT id
         FROM accounts
         WHERE TRIM(COALESCE(api_key, '')) = ''",
    )?;
    let rows = statement.query_map([], |row| row.get::<_, String>(0))?;
    let account_ids = rows.collect::<rusqlite::Result<Vec<_>>>()?;

    let service_name = "com.yls.workbench.api-key";
    let transaction = connection.unchecked_transaction()?;

    for account_id in account_ids {
        let legacy_api_key = load_keychain_api_key(service_name, &account_id)?;
        if let Some(api_key) = legacy_api_key.filter(|value| !value.trim().is_empty()) {
            transaction.execute(
                "UPDATE accounts SET api_key = ?2 WHERE id = ?1",
                params![account_id, api_key],
            )?;
            delete_keychain_api_key(service_name, &account_id)?;
        }
    }

    crate::db::migrations::set_meta_value(&transaction, KEYCHAIN_MIGRATION_META_KEY, "1")?;
    transaction.commit()?;
    Ok(())
}

fn initialize_app_state(app_handle: &tauri::AppHandle) -> Result<AppState> {
    let data_dir = app_handle
        .path()
        .app_local_data_dir()
        .context("failed to resolve app local data directory")?;
    let db_path = db::bootstrap_database_at(&data_dir)?;
    run_keychain_api_key_migration(&db_path)?;

    Ok(AppState::new(db_path))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(
            tauri_plugin_updater::Builder::new()
                .pubkey(env!("TAURI_UPDATER_PUBKEY"))
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            commands::accounts::delete_account,
            commands::accounts::list_accounts,
            commands::accounts::save_account,
            commands::accounts::set_account_enabled,
            commands::query::query_analytics,
            commands::query::query_logs,
            commands::query::query_overview,
            commands::system::get_system_timezone,
            commands::sync::start_sync,
        ])
        .setup(|app| {
            let state = initialize_app_state(app.handle())?;
            app.manage(state);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
