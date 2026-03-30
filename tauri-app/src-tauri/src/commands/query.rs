use tauri::State;

use crate::{
    app_state::AppState,
    services::query_service::{
        AnalyticsQueryInput, AnalyticsResponse, LogsQueryInput, LogsQueryResponse, OverviewResponse,
        QueryService,
    },
};

#[tauri::command]
pub fn query_overview(
    state: State<'_, AppState>,
    account_id: String,
) -> Result<OverviewResponse, String> {
    QueryService::query_overview(state.inner(), &account_id).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn query_logs(
    state: State<'_, AppState>,
    input: LogsQueryInput,
) -> Result<LogsQueryResponse, String> {
    QueryService::query_logs(state.inner(), input).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn query_analytics(
    state: State<'_, AppState>,
    input: AnalyticsQueryInput,
) -> Result<AnalyticsResponse, String> {
    QueryService::query_analytics(state.inner(), input).map_err(|error| error.to_string())
}
