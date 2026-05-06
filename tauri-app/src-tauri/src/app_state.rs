use std::{
    collections::HashSet,
    path::PathBuf,
    sync::{Arc, Mutex},
};

#[derive(Clone, Debug)]
pub struct AppState {
    pub db_path: PathBuf,
    pub active_sync_accounts: Arc<Mutex<HashSet<String>>>,
}

impl AppState {
    pub fn new(db_path: PathBuf) -> Self {
        Self {
            db_path,
            active_sync_accounts: Arc::new(Mutex::new(HashSet::new())),
        }
    }
}
