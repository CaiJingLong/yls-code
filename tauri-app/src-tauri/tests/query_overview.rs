use std::sync::Arc;

use rusqlite::Connection;
use tempfile::{tempdir, TempDir};

use tauri_app_lib::{
    app_state::AppState,
    db::bootstrap_database_at,
    services::{
        query_service::QueryService,
        secret_store::{MemorySecretStore, SecretStore},
    },
};

#[test]
fn query_overview_returns_account_usage_and_sync_metadata() {
    let (state, _store, _tempdir) = seeded_state();

    let overview = QueryService::query_overview(&state, "acct-query").expect("query overview");

    assert_eq!(overview.account_name, "Query Account");
    assert!(overview.has_api_key);
    assert_eq!(overview.cached_log_count, 3);
    assert_eq!(overview.total_tokens, 4200);
    assert!((overview.total_cost_usd - 0.017).abs() < f64::EPSILON);
    assert_eq!(overview.last_successful_sync_at.as_deref(), Some("100"));
}

fn seeded_state() -> (AppState, MemorySecretStore, TempDir) {
    let tempdir = tempdir().expect("tempdir");
    let data_dir = tempdir.path().join("app-local-data");
    let db_path = bootstrap_database_at(&data_dir).expect("bootstrap database");
    let store = MemorySecretStore::default();
    let state = AppState::new(db_path.clone(), Arc::new(store.clone()));
    store
        .save_api_key("acct-query", "yls-secret")
        .expect("save api key");

    let connection = Connection::open(db_path).expect("open sqlite db");
    seed_account(&connection);
    seed_logs(&connection);
    seed_sync_state(&connection);

    (state, store, tempdir)
}

fn seed_account(connection: &Connection) {
    connection
        .execute(
            "INSERT INTO accounts (
                id, name, base_url, enabled, created_at, updated_at, last_used_at
             ) VALUES ('acct-query', 'Query Account', 'https://code.ylsagi.com', 1, '1', '2', NULL)",
            [],
        )
        .expect("seed account");
}

fn seed_logs(connection: &Connection) {
    let rows = [
        ("log-1", "gpt-5.4", "xhigh", 0.006, 1200, "2026-03-29T10:00:00.000Z"),
        ("log-2", "gpt-5.4-mini", "medium", 0.005, 1400, "2026-03-29T11:00:00.000Z"),
        ("log-3", "gpt-5.4", "medium", 0.006, 1600, "2026-03-30T09:00:00.000Z"),
    ];

    for (remote_id, model_name, reasoning, total_cost_usd, total_tokens, created_at) in rows {
        connection
            .execute(
                "INSERT INTO logs (
                    account_id, remote_log_id, log_fingerprint, model_name, reasoning,
                    total_cost_usd, total_tokens, created_at, raw_json
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, '{}')",
                rusqlite::params![
                    "acct-query",
                    remote_id,
                    format!("fp-{remote_id}"),
                    model_name,
                    reasoning,
                    total_cost_usd,
                    total_tokens,
                    created_at,
                ],
            )
            .expect("seed log");
    }
}

fn seed_sync_state(connection: &Connection) {
    connection
        .execute(
            "INSERT INTO sync_state (
                account_id, full_sync_completed, last_full_sync_at,
                last_incremental_sync_at, last_successful_sync_at, last_scanned_page, last_error
             ) VALUES ('acct-query', 1, '90', '95', '100', 3, NULL)",
            [],
        )
        .expect("seed sync state");
}
