use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};

use super::yls_client::YlsCodexLogItem;

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct NormalizedLogRecord {
    pub remote_log_id: Option<String>,
    pub model_name: String,
    pub reasoning: String,
    pub input_tokens: i64,
    pub input_tokens_cached: i64,
    pub input_cache_creation_tokens: i64,
    pub output_tokens: i64,
    pub output_tokens_reasoning: i64,
    pub total_tokens: i64,
    pub input_cost_usd: f64,
    pub output_cost_usd: f64,
    pub cache_creation_cost_usd: f64,
    pub cache_read_cost_usd: f64,
    pub total_cost_usd: f64,
    pub created_at: String,
    pub updated_at: String,
    pub raw_json: String,
}

pub fn normalize_log_item(item: &YlsCodexLogItem) -> Result<NormalizedLogRecord> {
    Ok(NormalizedLogRecord {
        remote_log_id: Some(item.id.clone()),
        model_name: item.model.clone(),
        reasoning: item.reasoning.clone(),
        input_tokens: item.input_tokens,
        input_tokens_cached: item.input_tokens_cached,
        input_cache_creation_tokens: item.input_cache_creation_tokens,
        output_tokens: item.output_tokens,
        output_tokens_reasoning: item.output_tokens_reasoning,
        total_tokens: item.total_tokens,
        input_cost_usd: item.input_cost,
        output_cost_usd: item.output_cost,
        cache_creation_cost_usd: item.cache_creation_cost,
        cache_read_cost_usd: item.cache_read_cost,
        total_cost_usd: item.total_cost,
        created_at: item.created_at.clone(),
        updated_at: item.updated_at.clone(),
        raw_json: serde_json::to_string(item).context("failed to serialize raw YLS log item")?,
    })
}
