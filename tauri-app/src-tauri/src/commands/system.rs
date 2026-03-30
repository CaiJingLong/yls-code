#[tauri::command]
pub fn get_system_timezone() -> Result<String, String> {
    iana_time_zone::get_timezone().map_err(|error| error.to_string())
}
