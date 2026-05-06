fn main() {
    println!("cargo:rerun-if-env-changed=TAURI_UPDATER_PUBKEY");
    let profile = std::env::var("PROFILE").unwrap_or_default();
    let updater_pubkey = match std::env::var("TAURI_UPDATER_PUBKEY") {
        Ok(value) if !value.trim().is_empty() => value,
        _ if profile == "release" => {
            panic!("TAURI_UPDATER_PUBKEY is required for release builds");
        }
        _ => String::new(),
    };
    println!("cargo:rustc-env=TAURI_UPDATER_PUBKEY={updater_pubkey}");
    tauri_build::build()
}
