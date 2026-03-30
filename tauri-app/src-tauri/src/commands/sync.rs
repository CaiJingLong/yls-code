use tauri::{AppHandle, Emitter, State};

use crate::{
    app_state::AppState,
    events::SYNC_PROGRESS_EVENT,
    services::{
        sync_engine::SyncEngine,
        sync_progress::SyncKind,
    },
};

#[tauri::command]
pub async fn start_sync(
    app: AppHandle,
    state: State<'_, AppState>,
    account_id: String,
    kind: String,
) -> Result<(), String> {
    let kind = match kind.as_str() {
        "full" => SyncKind::Full,
        "incremental" => SyncKind::Incremental,
        _ => return Err(format!("unsupported sync kind `{kind}`")),
    };

    let state = state.inner().clone();
    let app_handle = app.clone();

    tauri::async_runtime::spawn_blocking(move || {
        SyncEngine::sync_account(&state, &account_id, kind, |progress| {
            app_handle
                .emit(SYNC_PROGRESS_EVENT, &progress)
                .map_err(|error| anyhow::anyhow!(error.to_string()))
        })
    })
    .await
    .map_err(|error| error.to_string())?
    .map_err(|error| error.to_string())
}
