use std::sync::Arc;

use mockito::{Matcher, Server};
use rusqlite::Connection;
use tempfile::{tempdir, TempDir};

use tauri_app_lib::{
    app_state::AppState,
    db::bootstrap_database_at,
    services::{
        account_service::{AccountService, SaveAccountInput},
        secret_store::MemorySecretStore,
        sync_engine::SyncEngine,
        sync_progress::{SyncKind, SyncProgressEvent, SyncStatus},
    },
};

fn sample_log_item(index: usize) -> serde_json::Value {
    serde_json::json!({
        "_id": format!("log-{index}"),
        "type": "subscription",
        "model": "gpt-5.4",
        "reasoning": "xhigh",
        "input_tokens": 1000 + index,
        "input_tokens_cached": 500 + index,
        "input_cache_creation_tokens": 0,
        "output_tokens": 200 + index,
        "output_tokens_reasoning": 100 + index,
        "total_tokens": 1200 + index,
        "input_cost": 0.001,
        "output_cost": 0.002,
        "cache_creation_cost": 0.0,
        "cache_read_cost": 0.003,
        "total_cost": 0.006,
        "createdAt": format!("2026-03-29T15:{:02}:00.000Z", index % 60),
        "updatedAt": format!("2026-03-29T15:{:02}:00.000Z", index % 60)
    })
}

#[test]
fn full_sync_fetches_pages_until_end_and_deduplicates_rows() {
    let (state, _store, _tempdir) = test_state();
    let mut server = Server::new();
    let first_page_items = (0..200).map(sample_log_item).collect::<Vec<_>>();
    let mut second_page_items = vec![sample_log_item(199)];
    second_page_items.extend((200..320).map(sample_log_item));

    let page1 = server
        .mock("GET", "/codex/logs")
        .match_query(Matcher::AllOf(vec![
            Matcher::UrlEncoded("page".into(), "1".into()),
            Matcher::UrlEncoded("page_size".into(), "200".into()),
        ]))
        .with_status(200)
        .with_body(
            serde_json::json!({
                "code": 200,
                "msg": "ok",
                "data": {
                    "items": first_page_items,
                    "page": 1,
                    "page_size": 200,
                    "total": 320
                }
            })
            .to_string(),
        )
        .create();
    let page2 = server
        .mock("GET", "/codex/logs")
        .match_query(Matcher::AllOf(vec![
            Matcher::UrlEncoded("page".into(), "2".into()),
            Matcher::UrlEncoded("page_size".into(), "200".into()),
        ]))
        .with_status(200)
        .with_body(
            serde_json::json!({
                "code": 200,
                "msg": "ok",
                "data": {
                    "items": second_page_items,
                    "page": 2,
                    "page_size": 200,
                    "total": 320
                }
            })
            .to_string(),
        )
        .create();

    seed_account(&state, &server.url());

    let mut events = Vec::<SyncProgressEvent>::new();
    SyncEngine::sync_account(&state, "acct-sync", SyncKind::Full, |progress| {
        events.push(progress);
        Ok(())
    })
    .expect("run full sync");

    page1.assert();
    page2.assert();

    let connection = Connection::open(&state.db_path).expect("open sqlite db");
    let log_count: i64 = connection
        .query_row("SELECT COUNT(1) FROM logs WHERE account_id = 'acct-sync'", [], |row| {
            row.get(0)
        })
        .expect("count logs");
    let job_status: String = connection
        .query_row("SELECT status FROM sync_jobs ORDER BY started_at DESC LIMIT 1", [], |row| {
            row.get(0)
        })
        .expect("read sync job status");

    let final_event = events.last().expect("final progress event");
    assert_eq!(log_count, 320);
    assert_eq!(job_status, "completed");
    assert_eq!(final_event.status, SyncStatus::Completed);
    assert_eq!(final_event.scanned_pages, 2);
    assert_eq!(final_event.inserted_rows, 320);
}

fn test_state() -> (AppState, MemorySecretStore, TempDir) {
    let tempdir = tempdir().expect("tempdir");
    let data_dir = tempdir.path().join("app-local-data");
    let db_path = bootstrap_database_at(&data_dir).expect("bootstrap database");
    let store = MemorySecretStore::default();
    let state = AppState::new(db_path, Arc::new(store.clone()));

    (state, store, tempdir)
}

fn seed_account(state: &AppState, base_url: &str) {
    AccountService::save_account(
        state,
        SaveAccountInput {
            id: Some("acct-sync".into()),
            name: "Sync Account".into(),
            base_url: base_url.into(),
            api_key: "yls-secret".into(),
            enabled: Some(true),
        },
    )
    .expect("save sync account");
}
