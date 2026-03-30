use tauri_app_lib::services::{
    log_fingerprint::fingerprint_log,
    log_normalizer::NormalizedLogRecord,
};

fn sample_record() -> NormalizedLogRecord {
    NormalizedLogRecord {
        remote_log_id: None,
        model_name: "gpt-5.4".into(),
        reasoning: "xhigh".into(),
        input_tokens: 1000,
        input_tokens_cached: 500,
        input_cache_creation_tokens: 0,
        output_tokens: 200,
        output_tokens_reasoning: 100,
        total_tokens: 1200,
        input_cost_usd: 0.001,
        output_cost_usd: 0.002,
        cache_creation_cost_usd: 0.0,
        cache_read_cost_usd: 0.003,
        total_cost_usd: 0.006,
        created_at: "2026-03-29T15:01:00.000Z".into(),
        updated_at: "2026-03-29T15:01:00.000Z".into(),
        raw_json: "{\"_id\":\"log-1\"}".into(),
    }
}

#[test]
fn fingerprint_is_deterministic_when_remote_id_is_missing() {
    let first = sample_record();
    let second = sample_record();

    assert_eq!(fingerprint_log(&first), fingerprint_log(&second));
}

#[test]
fn fingerprint_changes_when_log_payload_changes() {
    let first = sample_record();
    let mut second = sample_record();
    second.total_cost_usd = 0.007;

    assert_ne!(fingerprint_log(&first), fingerprint_log(&second));
}
