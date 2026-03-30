use sha2::{Digest, Sha256};

use super::log_normalizer::NormalizedLogRecord;

pub fn fingerprint_log(record: &NormalizedLogRecord) -> String {
    let mut hasher = Sha256::new();

    hasher.update(record.created_at.as_bytes());
    hasher.update(record.model_name.as_bytes());
    hasher.update(record.reasoning.as_bytes());
    hasher.update(record.total_tokens.to_string().as_bytes());
    hasher.update(record.total_cost_usd.to_string().as_bytes());
    hasher.update(record.raw_json.as_bytes());

    format!("{:x}", hasher.finalize())
}
