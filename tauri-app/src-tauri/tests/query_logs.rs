use std::sync::Arc;

use rusqlite::Connection;
use tempfile::{tempdir, TempDir};

use tauri_app_lib::{
    app_state::AppState,
    db::bootstrap_database_at,
    services::{
        query_service::{LogsQueryInput, QueryService},
        secret_store::MemorySecretStore,
    },
};

#[test]
fn query_logs_supports_filters_and_pagination() {
    let (state, _store, _tempdir) = seeded_state();

    let response = QueryService::query_logs(
        &state,
        LogsQueryInput {
            account_id: "acct-query".into(),
            page: 1,
            page_size: 1,
            search: Some("mini".into()),
            model: Some("gpt-5.4-mini".into()),
            created_after: Some("2026-03-29T00:00:00.000Z".into()),
            created_before: Some("2026-03-29T23:59:59.000Z".into()),
        },
    )
    .expect("query logs");

    assert_eq!(response.total, 1);
    assert_eq!(response.items.len(), 1);
    assert_eq!(response.items[0].model_name, "gpt-5.4-mini");
    assert_eq!(response.items[0].remote_log_id.as_deref(), Some("log-2"));
}

fn seeded_state() -> (AppState, MemorySecretStore, TempDir) {
    let tempdir = tempdir().expect("tempdir");
    let data_dir = tempdir.path().join("app-local-data");
    let db_path = bootstrap_database_at(&data_dir).expect("bootstrap database");
    let store = MemorySecretStore::default();
    let state = AppState::new(db_path.clone(), Arc::new(store.clone()));
    let connection = Connection::open(db_path).expect("open sqlite db");

    connection
        .execute(
            "INSERT INTO accounts (
                id, name, base_url, enabled, created_at, updated_at, last_used_at
             ) VALUES ('acct-query', 'Query Account', 'https://code.ylsagi.com', 1, '1', '2', NULL)",
            [],
        )
        .expect("seed account");

    let rows = [
        ("log-1", "gpt-5.4", "xhigh", 0.006, 1200, "2026-03-29T10:00:00.000Z", "{\"model\":\"gpt-5.4\"}"),
        ("log-2", "gpt-5.4-mini", "mini reasoning", 0.005, 1400, "2026-03-29T11:00:00.000Z", "{\"model\":\"gpt-5.4-mini\"}"),
        ("log-3", "gpt-5.4", "medium", 0.006, 1600, "2026-03-30T09:00:00.000Z", "{\"model\":\"gpt-5.4\"}"),
    ];

    for (remote_id, model_name, reasoning, total_cost_usd, total_tokens, created_at, raw_json) in rows {
        connection
            .execute(
                "INSERT INTO logs (
                    account_id, remote_log_id, log_fingerprint, model_name, reasoning,
                    total_cost_usd, total_tokens, created_at, raw_json
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                rusqlite::params![
                    "acct-query",
                    remote_id,
                    format!("fp-{remote_id}"),
                    model_name,
                    reasoning,
                    total_cost_usd,
                    total_tokens,
                    created_at,
                    raw_json,
                ],
            )
            .expect("seed log");
    }

    (state, store, tempdir)
}
