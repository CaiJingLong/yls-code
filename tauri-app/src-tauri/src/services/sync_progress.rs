use serde::Serialize;

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum SyncKind {
    Full,
    Incremental,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum SyncStatus {
    Running,
    Completed,
    Failed,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncProgressEvent {
    pub account_id: String,
    pub job_id: String,
    pub kind: SyncKind,
    pub status: SyncStatus,
    pub scanned_pages: u32,
    pub inserted_rows: u32,
    pub updated_rows: u32,
    pub message: Option<String>,
}
