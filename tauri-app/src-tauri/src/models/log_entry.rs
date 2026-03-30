use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct LogEntryRecord {
    pub account_id: String,
    pub remote_log_id: Option<String>,
    pub log_fingerprint: String,
    pub model_name: Option<String>,
    pub reasoning: Option<String>,
    pub total_cost_usd: Option<f64>,
    pub total_tokens: Option<i64>,
    pub created_at: String,
    pub raw_json: String,
}
