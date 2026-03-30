use anyhow::{Context, Result};
use rusqlite::{
    params_from_iter,
    types::Value,
    Connection, OptionalExtension,
};
use serde::{Deserialize, Serialize};

use crate::app_state::AppState;

use super::yls_client::YlsClient;

pub struct QueryService;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OverviewResponse {
    pub account_id: String,
    pub account_name: String,
    pub base_url: String,
    pub enabled: bool,
    pub has_api_key: bool,
    pub today_remaining_quota: Option<f64>,
    pub cached_log_count: i64,
    pub total_cost_usd: f64,
    pub total_tokens: i64,
    pub latest_log_at: Option<String>,
    pub last_successful_sync_at: Option<String>,
    pub last_incremental_sync_at: Option<String>,
    pub last_full_sync_at: Option<String>,
    pub last_error: Option<String>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogsQueryInput {
    pub account_id: String,
    pub page: u32,
    pub page_size: u32,
    pub search: Option<String>,
    pub model: Option<String>,
    pub created_after: Option<String>,
    pub created_before: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LogListItem {
    pub id: i64,
    pub remote_log_id: Option<String>,
    pub model_name: String,
    pub reasoning: String,
    pub total_cost_usd: f64,
    pub total_tokens: i64,
    pub created_at: String,
    pub raw_json: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LogsQueryResponse {
    pub items: Vec<LogListItem>,
    pub page: u32,
    pub page_size: u32,
    pub total: i64,
}

#[derive(Clone, Copy, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AnalyticsGranularity {
    Hour,
    Day,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsQueryInput {
    pub account_id: String,
    pub granularity: AnalyticsGranularity,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelCostPoint {
    pub model_name: String,
    pub total_cost_usd: f64,
    pub total_tokens: i64,
    pub request_count: i64,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TrendPoint {
    pub bucket: String,
    pub total_cost_usd: f64,
    pub total_tokens: i64,
    pub request_count: i64,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsResponse {
    pub model_breakdown: Vec<ModelCostPoint>,
    pub trend: Vec<TrendPoint>,
}

impl QueryService {
    pub fn query_overview(state: &AppState, account_id: &str) -> Result<OverviewResponse> {
        let connection = Self::open_connection(state)?;
        let account = connection
            .query_row(
                "SELECT id, name, base_url, enabled FROM accounts WHERE id = ?1",
                [account_id],
                |row| {
                    Ok((
                        row.get::<_, String>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, String>(2)?,
                        row.get::<_, i64>(3)? != 0,
                    ))
                },
            )
            .optional()?
            .with_context(|| format!("account `{account_id}` was not found"))?;
        let api_key = state.secret_store.load_api_key(account_id)?;
        let today_remaining_quota = api_key
            .as_ref()
            .map(|api_key| {
                YlsClient::new(account.2.clone(), api_key.clone())
                    .fetch_info()
                    .map(|response| response.state.user_packge_usage.remaining_quota)
            })
            .transpose()?;
        let usage = connection.query_row(
            "SELECT
                COUNT(1),
                COALESCE(SUM(total_cost_usd), 0),
                COALESCE(SUM(total_tokens), 0),
                MAX(created_at)
             FROM logs
             WHERE account_id = ?1",
            [account_id],
            |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, f64>(1)?,
                    row.get::<_, i64>(2)?,
                    row.get::<_, Option<String>>(3)?,
                ))
            },
        )?;
        let sync = connection
            .query_row(
                "SELECT last_successful_sync_at, last_incremental_sync_at, last_full_sync_at, last_error
                 FROM sync_state
                 WHERE account_id = ?1",
                [account_id],
                |row| {
                    Ok((
                        row.get::<_, Option<String>>(0)?,
                        row.get::<_, Option<String>>(1)?,
                        row.get::<_, Option<String>>(2)?,
                        row.get::<_, Option<String>>(3)?,
                    ))
                },
            )
            .optional()?
            .unwrap_or((None, None, None, None));

        Ok(OverviewResponse {
            account_id: account.0,
            account_name: account.1,
            base_url: account.2,
            enabled: account.3,
            has_api_key: api_key.is_some(),
            today_remaining_quota,
            cached_log_count: usage.0,
            total_cost_usd: usage.1,
            total_tokens: usage.2,
            latest_log_at: usage.3,
            last_successful_sync_at: sync.0,
            last_incremental_sync_at: sync.1,
            last_full_sync_at: sync.2,
            last_error: sync.3,
        })
    }

    pub fn query_logs(state: &AppState, input: LogsQueryInput) -> Result<LogsQueryResponse> {
        let connection = Self::open_connection(state)?;
        let page = input.page.max(1);
        let page_size = input.page_size.max(1);
        let offset = i64::from((page - 1) * page_size);

        let (where_sql, params) = build_logs_filters(&input);
        let count_sql = format!("SELECT COUNT(1) FROM logs WHERE {where_sql}");
        let total = connection.query_row(&count_sql, params_from_iter(params.iter()), |row| {
            row.get::<_, i64>(0)
        })?;

        let mut data_params = params.clone();
        data_params.push(Value::from(i64::from(page_size)));
        data_params.push(Value::from(offset));

        let data_sql = format!(
            "SELECT id, remote_log_id, COALESCE(model_name, 'Unknown'), COALESCE(reasoning, ''),
                    COALESCE(total_cost_usd, 0), COALESCE(total_tokens, 0), created_at, raw_json
             FROM logs
             WHERE {where_sql}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?"
        );

        let mut statement = connection.prepare(&data_sql)?;
        let rows = statement.query_map(params_from_iter(data_params.iter()), |row| {
            Ok(LogListItem {
                id: row.get(0)?,
                remote_log_id: row.get(1)?,
                model_name: row.get(2)?,
                reasoning: row.get(3)?,
                total_cost_usd: row.get(4)?,
                total_tokens: row.get(5)?,
                created_at: row.get(6)?,
                raw_json: row.get(7)?,
            })
        })?;
        let items = rows.collect::<rusqlite::Result<Vec<_>>>()?;

        Ok(LogsQueryResponse {
            items,
            page,
            page_size,
            total,
        })
    }

    pub fn query_analytics(state: &AppState, input: AnalyticsQueryInput) -> Result<AnalyticsResponse> {
        let connection = Self::open_connection(state)?;
        let model_breakdown = Self::query_model_breakdown(&connection, &input.account_id)?;
        let trend = Self::query_trend(&connection, &input.account_id, input.granularity)?;

        Ok(AnalyticsResponse {
            model_breakdown,
            trend,
        })
    }

    fn query_model_breakdown(connection: &Connection, account_id: &str) -> Result<Vec<ModelCostPoint>> {
        let mut statement = connection.prepare(
            "SELECT
                COALESCE(model_name, 'Unknown') AS model_name,
                COALESCE(SUM(total_cost_usd), 0) AS total_cost_usd,
                COALESCE(SUM(total_tokens), 0) AS total_tokens,
                COUNT(1) AS request_count
             FROM logs
             WHERE account_id = ?1
             GROUP BY COALESCE(model_name, 'Unknown')
             ORDER BY total_cost_usd DESC, total_tokens DESC",
        )?;

        let rows = statement.query_map([account_id], |row| {
            Ok(ModelCostPoint {
                model_name: row.get(0)?,
                total_cost_usd: row.get(1)?,
                total_tokens: row.get(2)?,
                request_count: row.get(3)?,
            })
        })?;

        Ok(rows.collect::<rusqlite::Result<Vec<_>>>()?)
    }

    fn query_trend(
        connection: &Connection,
        account_id: &str,
        granularity: AnalyticsGranularity,
    ) -> Result<Vec<TrendPoint>> {
        let bucket_sql = match granularity {
            AnalyticsGranularity::Hour => "substr(created_at, 1, 13) || ':00:00Z'",
            AnalyticsGranularity::Day => "substr(created_at, 1, 10)",
        };
        let sql = format!(
            "SELECT
                {bucket_sql} AS bucket,
                COALESCE(SUM(total_cost_usd), 0) AS total_cost_usd,
                COALESCE(SUM(total_tokens), 0) AS total_tokens,
                COUNT(1) AS request_count
             FROM logs
             WHERE account_id = ?1
             GROUP BY bucket
             ORDER BY bucket ASC"
        );
        let mut statement = connection.prepare(&sql)?;
        let rows = statement.query_map([account_id], |row| {
            Ok(TrendPoint {
                bucket: row.get(0)?,
                total_cost_usd: row.get(1)?,
                total_tokens: row.get(2)?,
                request_count: row.get(3)?,
            })
        })?;

        Ok(rows.collect::<rusqlite::Result<Vec<_>>>()?)
    }

    fn open_connection(state: &AppState) -> Result<Connection> {
        Connection::open(&state.db_path).with_context(|| {
            format!(
                "failed to open sqlite database at {}",
                state.db_path.display()
            )
        })
    }
}

fn build_logs_filters(input: &LogsQueryInput) -> (String, Vec<Value>) {
    let mut clauses = vec!["account_id = ?".to_string()];
    let mut params = vec![Value::from(input.account_id.clone())];

    if let Some(search) = input.search.as_ref().filter(|value| !value.trim().is_empty()) {
        let pattern = format!("%{}%", search.trim());
        clauses.push(
            "(COALESCE(model_name, '') LIKE ? OR COALESCE(reasoning, '') LIKE ? OR raw_json LIKE ?)".to_string(),
        );
        params.push(Value::from(pattern.clone()));
        params.push(Value::from(pattern.clone()));
        params.push(Value::from(pattern));
    }

    if let Some(model) = input.model.as_ref().filter(|value| !value.trim().is_empty()) {
        clauses.push("COALESCE(model_name, '') = ?".to_string());
        params.push(Value::from(model.trim().to_string()));
    }

    if let Some(created_after) = input.created_after.as_ref().filter(|value| !value.trim().is_empty()) {
        clauses.push("created_at >= ?".to_string());
        params.push(Value::from(created_after.trim().to_string()));
    }

    if let Some(created_before) = input.created_before.as_ref().filter(|value| !value.trim().is_empty()) {
        clauses.push("created_at <= ?".to_string());
        params.push(Value::from(created_before.trim().to_string()));
    }

    (clauses.join(" AND "), params)
}
