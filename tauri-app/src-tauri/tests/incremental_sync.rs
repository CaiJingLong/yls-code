use mockito::{Matcher, Server};
use rusqlite::Connection;
use tempfile::{tempdir, TempDir};

use tauri_app_lib::{
    app_state::AppState,
    db::bootstrap_database_at,
    services::{
        account_service::{AccountService, SaveAccountInput},
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
fn incremental_sync_stops_when_newest_page_has_no_new_rows() {
    let (state, _tempdir) = test_state();
    let mut server = Server::new();

    seed_account(&state, &server.url());
    seed_existing_logs(&state);

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
                    "items": [sample_log_item(0), sample_log_item(1)],
                    "page": 1,
                    "page_size": 200,
                    "total": 2
                }
            })
            .to_string(),
        )
        .expect(1)
        .create();

    let mut events = Vec::<SyncProgressEvent>::new();
    SyncEngine::sync_account(&state, "acct-sync", SyncKind::Incremental, |progress| {
        events.push(progress);
        Ok(())
    })
    .expect("run incremental sync");

    page1.assert();

    let final_event = events.last().expect("final progress event");
    assert_eq!(final_event.status, SyncStatus::Completed);
    assert_eq!(final_event.scanned_pages, 1);
    assert_eq!(final_event.inserted_rows, 0);
}

#[test]
fn incremental_sync_rejects_concurrent_runs_for_the_same_account() {
    let (state, _tempdir) = test_state();
    let server = Server::new();
    seed_account(&state, &server.url());

    state
        .active_sync_accounts
        .lock()
        .expect("active sync lock")
        .insert("acct-sync".into());

    let error = SyncEngine::sync_account(&state, "acct-sync", SyncKind::Incremental, |_| Ok(()))
        .expect_err("should reject concurrent sync");

    assert!(error.to_string().contains("already syncing"));
}

fn test_state() -> (AppState, TempDir) {
    let tempdir = tempdir().expect("tempdir");
    let data_dir = tempdir.path().join("app-local-data");
    let db_path = bootstrap_database_at(&data_dir).expect("bootstrap database");
    let state = AppState::new(db_path);

    (state, tempdir)
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

fn seed_existing_logs(state: &AppState) {
    let connection = Connection::open(&state.db_path).expect("open sqlite db");

    for index in 0..2 {
        connection
            .execute(
                "INSERT INTO logs (
                    account_id, remote_log_id, log_fingerprint, model_name, reasoning,
                    total_cost_usd, total_tokens, created_at, raw_json
                 ) VALUES (?1, ?2, ?3, 'gpt-5.4', 'xhigh', 0.006, 1200, ?4, '{}')",
                [
                    "acct-sync",
                    &format!("log-{index}"),
                    &format!("fp-{index}"),
                    &format!("2026-03-29T15:{:02}:00.000Z", index % 60),
                ],
            )
            .expect("seed existing log");
    }
}
