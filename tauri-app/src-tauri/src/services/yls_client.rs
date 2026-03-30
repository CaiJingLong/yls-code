use anyhow::{bail, Context, Result};
use reqwest::blocking::Client;
use serde::Deserialize;

pub const REMOTE_PAGE_SIZE_LIMIT: u32 = 200;

#[derive(Clone, Debug)]
pub struct YlsClient {
    client: Client,
    base_url: String,
    api_key: String,
}

impl YlsClient {
    pub fn new(base_url: impl Into<String>, api_key: impl Into<String>) -> Self {
        Self {
            client: Client::new(),
            base_url: base_url.into().trim_end_matches('/').to_string(),
            api_key: api_key.into(),
        }
    }

    pub fn fetch_info(&self) -> Result<YlsCodexInfoResponse> {
        self.request("/codex/info", None::<&[(&str, String)]>)
    }

    pub fn fetch_logs(&self, page: u32, page_size: u32) -> Result<YlsCodexLogsResponse> {
        let capped_page_size = page_size.min(REMOTE_PAGE_SIZE_LIMIT);
        let query = [
            ("page", page.to_string()),
            ("page_size", capped_page_size.to_string()),
        ];

        self.request("/codex/logs", Some(&query))
    }

    fn request<T: for<'de> Deserialize<'de>>(
        &self,
        path: &str,
        query: Option<&[(&str, String)]>,
    ) -> Result<T> {
        let url = format!("{}{}", self.base_url, path);
        let mut request = self
            .client
            .get(&url)
            .header("Accept", "application/json")
            .bearer_auth(&self.api_key);

        if let Some(query) = query {
            request = request.query(query);
        }

        let response = request
            .send()
            .with_context(|| format!("failed to request `{url}`"))?;
        let status = response.status();

        if !status.is_success() {
            bail!("request `{url}` failed with status {status}");
        }

        response
            .json::<T>()
            .with_context(|| format!("failed to deserialize `{url}` response"))
    }
}

#[derive(Clone, Debug, Deserialize)]
pub struct YlsCodexInfoResponse {
    pub code: i32,
    pub msg: String,
    pub state: YlsCodexState,
}

#[derive(Clone, Debug, Deserialize)]
pub struct YlsCodexState {
    #[serde(rename = "toDay")]
    pub to_day: String,
    #[serde(rename = "package")]
    pub package: YlsPackageState,
    #[serde(rename = "userPackgeUsage")]
    pub user_packge_usage: YlsUserPackageUsage,
    #[serde(rename = "userAccountInfo")]
    pub user_account_info: YlsUserAccountInfo,
}

#[derive(Clone, Debug, Deserialize)]
pub struct YlsPackageState {
    pub total_quota: f64,
    pub cache: bool,
    pub package_level: i64,
    pub packages: Vec<YlsPackageRecord>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct YlsPackageRecord {
    #[serde(rename = "_id")]
    pub id: String,
    pub package_type: String,
    pub expires_at: String,
}

#[derive(Clone, Debug, Deserialize)]
pub struct YlsUserPackageUsage {
    pub total_tokens: i64,
    pub total_cost: f64,
    pub request_count: i64,
    pub total_quota: f64,
    pub remaining_quota: f64,
}

#[derive(Clone, Debug, Deserialize)]
pub struct YlsUserAccountInfo {
    pub total_balance: f64,
    #[serde(rename = "accountId")]
    pub account_id: Option<String>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct YlsCodexLogsResponse {
    pub code: i32,
    pub msg: String,
    pub data: YlsCodexLogsData,
}

#[derive(Clone, Debug, Deserialize)]
pub struct YlsCodexLogsData {
    pub items: Vec<YlsCodexLogItem>,
    pub page: u32,
    pub page_size: u32,
    pub total: u32,
}

#[derive(Clone, Debug, Deserialize, serde::Serialize)]
pub struct YlsCodexLogItem {
    #[serde(rename = "_id")]
    pub id: String,
    #[serde(rename = "type")]
    pub billing_type: String,
    pub model: String,
    pub reasoning: String,
    pub input_tokens: i64,
    pub input_tokens_cached: i64,
    pub input_cache_creation_tokens: i64,
    pub output_tokens: i64,
    pub output_tokens_reasoning: i64,
    pub total_tokens: i64,
    pub input_cost: f64,
    pub output_cost: f64,
    pub cache_creation_cost: f64,
    pub cache_read_cost: f64,
    pub total_cost: f64,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}
