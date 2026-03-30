use mockito::{Matcher, Server};

use tauri_app_lib::services::{
    log_normalizer::normalize_log_item,
    yls_client::{YlsClient, YlsCodexInfoResponse},
};

fn sample_log_item(index: usize, model: &str) -> serde_json::Value {
    serde_json::json!({
        "_id": format!("log-{index}"),
        "type": "subscription",
        "model": model,
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
fn fetch_info_sends_bearer_token_and_parses_response() {
    let mut server = Server::new();
    let mock = server
        .mock("GET", "/codex/info")
        .match_header("authorization", "Bearer test-key")
        .with_status(200)
        .with_body(
            serde_json::json!({
                "code": 200,
                "msg": "ok",
                "state": {
                    "toDay": "2026-03-30",
                    "package": {
                        "total_quota": 100.0,
                        "cache": true,
                        "package_level": 1,
                        "packages": [
                            {
                                "_id": "pkg-1",
                                "package_type": "pro",
                                "expires_at": "2026-04-30T00:00:00.000Z"
                            }
                        ]
                    },
                    "userPackgeUsage": {
                        "total_tokens": 1234,
                        "total_cost": 12.5,
                        "request_count": 20,
                        "total_quota": 100.0,
                        "remaining_quota": 87.5
                    },
                    "userAccountInfo": {
                        "total_balance": 20.0,
                        "accountId": "acct-1"
                    }
                }
            })
            .to_string(),
        )
        .create();

    let client = YlsClient::new(server.url(), "test-key");
    let response: YlsCodexInfoResponse = client.fetch_info().expect("fetch info");

    mock.assert();
    assert_eq!(response.code, 200);
    assert_eq!(response.state.user_packge_usage.remaining_quota, 87.5);
    assert_eq!(response.state.package.packages[0].package_type, "pro");
}

#[test]
fn fetch_logs_parses_items_and_normalizes_them() {
    let mut server = Server::new();
    let mock = server
        .mock("GET", "/codex/logs")
        .match_header("authorization", "Bearer test-key")
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
                    "items": [
                        sample_log_item(1, "gpt-5.4"),
                        sample_log_item(2, "gpt-5.4-mini")
                    ],
                    "page": 1,
                    "page_size": 200,
                    "total": 2
                }
            })
            .to_string(),
        )
        .create();

    let client = YlsClient::new(server.url(), "test-key");
    let response = client.fetch_logs(1, 500).expect("fetch logs");
    let normalized = normalize_log_item(&response.data.items[0]).expect("normalize first log");

    mock.assert();
    assert_eq!(response.code, 200);
    assert_eq!(response.data.page_size, 200);
    assert_eq!(response.data.items.len(), 2);
    assert_eq!(normalized.remote_log_id.as_deref(), Some("log-1"));
    assert_eq!(normalized.model_name, "gpt-5.4");
    assert!(normalized.raw_json.contains("\"_id\":\"log-1\""));
}
