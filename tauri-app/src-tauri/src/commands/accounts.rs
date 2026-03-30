use tauri::State;

use crate::{
    app_state::AppState,
    services::account_service::{AccountService, AccountSummary, SaveAccountInput},
};

#[tauri::command]
pub fn save_account(
    state: State<'_, AppState>,
    input: SaveAccountInput,
) -> Result<AccountSummary, String> {
    AccountService::save_account(state.inner(), input).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn list_accounts(state: State<'_, AppState>) -> Result<Vec<AccountSummary>, String> {
    AccountService::list_accounts(state.inner()).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn set_account_enabled(
    state: State<'_, AppState>,
    account_id: String,
    enabled: bool,
) -> Result<AccountSummary, String> {
    AccountService::set_account_enabled(state.inner(), &account_id, enabled)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn delete_account(state: State<'_, AppState>, account_id: String) -> Result<(), String> {
    AccountService::delete_account(state.inner(), &account_id).map_err(|error| error.to_string())
}
