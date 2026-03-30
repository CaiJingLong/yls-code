use std::{path::PathBuf, sync::Arc};

use crate::services::secret_store::SecretStore;

#[derive(Clone, Debug)]
pub struct AppState {
    pub db_path: PathBuf,
    pub secret_store: Arc<dyn SecretStore>,
}

impl AppState {
    pub fn new(db_path: PathBuf, secret_store: Arc<dyn SecretStore>) -> Self {
        Self {
            db_path,
            secret_store,
        }
    }
}
