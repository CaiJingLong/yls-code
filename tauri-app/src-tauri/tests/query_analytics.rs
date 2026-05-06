use rusqlite::Connection;
use tempfile::{tempdir, TempDir};

use tauri_app_lib::{
    app_state::AppState,
    db::bootstrap_database_at,
    services::query_service::{AnalyticsGranularity, AnalyticsQueryInput, QueryService},
};

#[test]
fn query_analytics_aggregates_by_model_and_day() {
    let (state, _tempdir) = seeded_state();

    let response = QueryService::query_analytics(
        &state,
        AnalyticsQueryInput {
            account_id: "acct-query".into(),
            granularity: AnalyticsGranularity::Day,
            created_after: None,
            created_before: None,
        },
    )
    .expect("query analytics");

    assert_eq!(response.model_breakdown[0].model_name, "gpt-5.4");
    assert_eq!(response.model_breakdown[1].model_name, "gpt-5.4-mini");
    assert_eq!(response.trend.len(), 2);
    assert_eq!(response.trend[0].bucket, "2026-03-29");
}

#[test]
fn query_analytics_aggregates_by_hour() {
    let (state, _tempdir) = seeded_state();

    let response = QueryService::query_analytics(
        &state,
        AnalyticsQueryInput {
            account_id: "acct-query".into(),
            granularity: AnalyticsGranularity::Hour,
            created_after: None,
            created_before: None,
        },
    )
    .expect("query analytics");

    assert_eq!(response.trend.len(), 3);
    assert_eq!(response.trend[0].bucket, "2026-03-29T10:00:00Z");
    assert_eq!(response.trend[2].bucket, "2026-03-30T09:00:00Z");
}

#[test]
fn query_analytics_supports_time_range_filters() {
    let (state, _tempdir) = seeded_state();

    let response = QueryService::query_analytics(
        &state,
        AnalyticsQueryInput {
            account_id: "acct-query".into(),
            granularity: AnalyticsGranularity::Day,
            created_after: Some("2026-03-30T00:00:00.000Z".into()),
            created_before: Some("2026-03-30T23:59:59.000Z".into()),
        },
    )
    .expect("query analytics with time filters");

    assert_eq!(response.model_breakdown.len(), 1);
    assert_eq!(response.model_breakdown[0].model_name, "gpt-5.4");
    assert_eq!(response.model_breakdown[0].request_count, 1);
    assert_eq!(response.trend.len(), 1);
    assert_eq!(response.trend[0].bucket, "2026-03-30");
}

fn seeded_state() -> (AppState, TempDir) {
    let tempdir = tempdir().expect("tempdir");
    let data_dir = tempdir.path().join("app-local-data");
    let db_path = bootstrap_database_at(&data_dir).expect("bootstrap database");
    let state = AppState::new(db_path.clone());
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
        (
            "log-1",
            "gpt-5.4",
            "xhigh",
            0.006,
            1200,
            "2026-03-29T10:00:00.000Z",
        ),
        (
            "log-2",
            "gpt-5.4-mini",
            "mini reasoning",
            0.005,
            1400,
            "2026-03-29T11:00:00.000Z",
        ),
        (
            "log-3",
            "gpt-5.4",
            "medium",
            0.006,
            1600,
            "2026-03-30T09:00:00.000Z",
        ),
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

    (state, tempdir)
}
