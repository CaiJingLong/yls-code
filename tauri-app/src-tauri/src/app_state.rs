use std::{
    collections::HashSet,
    path::PathBuf,
    sync::{Arc, Mutex},
};

use crate::services::secret_store::SecretStore;

#[derive(Clone, Debug)]
pub struct AppState {
    pub db_path: PathBuf,
    pub secret_store: Arc<dyn SecretStore>,
    pub active_sync_accounts: Arc<Mutex<HashSet<String>>>,
}

impl AppState {
    pub fn new(db_path: PathBuf, secret_store: Arc<dyn SecretStore>) -> Self {
        Self {
            db_path,
            secret_store,
            active_sync_accounts: Arc::new(Mutex::new(HashSet::new())),
        }
    }
}
