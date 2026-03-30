use std::sync::Arc;

use rusqlite::Connection;
use tempfile::{tempdir, TempDir};

use tauri_app_lib::{
    app_state::AppState,
    db::bootstrap_database_at,
    services::{
        account_service::{AccountService, SaveAccountInput},
        secret_store::{MemorySecretStore, SecretStore},
    },
};

#[test]
fn save_account_persists_metadata_and_secret_outside_sqlite() {
    let (state, store, _tempdir) = test_state();

    let account = AccountService::save_account(
        &state,
        SaveAccountInput {
            id: None,
            name: "Primary".into(),
            base_url: "https://code.ylsagi.com".into(),
            api_key: "yls-secret".into(),
            enabled: Some(true),
        },
    )
    .expect("save account");

    assert!(account.has_api_key);
    assert_eq!(
        store
            .load_api_key(&account.id)
            .expect("load stored api key")
            .as_deref(),
        Some("yls-secret")
    );

    let connection = Connection::open(&state.db_path).expect("open sqlite database");
    let mut statement = connection
        .prepare("PRAGMA table_info(accounts)")
        .expect("prepare pragma");
    let columns = statement
        .query_map([], |row| row.get::<_, String>(1))
        .expect("query account columns")
        .collect::<rusqlite::Result<Vec<_>>>()
        .expect("collect columns");

    assert!(!columns.iter().any(|column| column == "api_key"));
}

#[test]
fn list_accounts_returns_sanitized_metadata() {
    let (state, _, _tempdir) = test_state();

    AccountService::save_account(
        &state,
        SaveAccountInput {
            id: Some("acct-1".into()),
            name: "Primary".into(),
            base_url: "https://code.ylsagi.com".into(),
            api_key: "yls-secret".into(),
            enabled: Some(true),
        },
    )
    .expect("save account");

    let accounts = AccountService::list_accounts(&state).expect("list accounts");
    let payload = serde_json::to_string(&accounts).expect("serialize accounts");

    assert_eq!(accounts.len(), 1);
    assert!(accounts[0].has_api_key);
    assert!(!payload.contains("yls-secret"));
}

#[test]
fn disable_and_delete_account_updates_sqlite_and_secret_state() {
    let (state, store, _tempdir) = test_state();

    let account = AccountService::save_account(
        &state,
        SaveAccountInput {
            id: Some("acct-2".into()),
            name: "Secondary".into(),
            base_url: "https://code.ylsagi.com".into(),
            api_key: "yls-secret-2".into(),
            enabled: Some(true),
        },
    )
    .expect("save account");

    let disabled =
        AccountService::set_account_enabled(&state, &account.id, false).expect("disable account");
    assert!(!disabled.enabled);

    let connection = Connection::open(&state.db_path).expect("open sqlite database");
    connection
        .execute(
            "INSERT INTO sync_state (account_id, last_scanned_page) VALUES (?1, 2)",
            [&account.id],
        )
        .expect("seed sync state");
    connection
        .execute(
            "INSERT INTO sync_jobs (job_id, account_id, kind, status, started_at)
             VALUES ('job-1', ?1, 'full', 'complete', '1')",
            [&account.id],
        )
        .expect("seed sync job");
    connection
        .execute(
            "INSERT INTO logs (
                account_id, remote_log_id, log_fingerprint, model_name, reasoning,
                total_cost_usd, total_tokens, created_at, raw_json
             ) VALUES (?1, 'remote-1', 'fp-1', 'model-a', 'none', 1.2, 32, '1', '{}')",
            [&account.id],
        )
        .expect("seed log");

    AccountService::delete_account(&state, &account.id).expect("delete account");

    let remaining_accounts: i64 = connection
        .query_row("SELECT COUNT(1) FROM accounts WHERE id = ?1", [&account.id], |row| {
            row.get(0)
        })
        .expect("count accounts");
    let remaining_sync_state: i64 = connection
        .query_row(
            "SELECT COUNT(1) FROM sync_state WHERE account_id = ?1",
            [&account.id],
            |row| row.get(0),
        )
        .expect("count sync state");
    let remaining_logs: i64 = connection
        .query_row("SELECT COUNT(1) FROM logs WHERE account_id = ?1", [&account.id], |row| {
            row.get(0)
        })
        .expect("count logs");

    assert_eq!(remaining_accounts, 0);
    assert_eq!(remaining_sync_state, 0);
    assert_eq!(remaining_logs, 0);
    assert_eq!(
        store
            .load_api_key(&account.id)
            .expect("load deleted api key"),
        None
    );
}

fn test_state() -> (AppState, MemorySecretStore, TempDir) {
    let tempdir = tempdir().expect("tempdir");
    let data_dir = tempdir.path().join("app-local-data");
    let db_path = bootstrap_database_at(&data_dir).expect("bootstrap database");
    let store = MemorySecretStore::default();
    let state = AppState::new(db_path, Arc::new(store.clone()));

    (state, store, tempdir)
}
