use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

use anyhow::{Context, Result};

pub trait SecretStore: Send + Sync + std::fmt::Debug {
    fn save_api_key(&self, account_id: &str, api_key: &str) -> Result<()>;
    fn load_api_key(&self, account_id: &str) -> Result<Option<String>>;
    fn delete_api_key(&self, account_id: &str) -> Result<()>;
}

#[derive(Debug)]
pub struct KeychainSecretStore {
    service_name: String,
}

impl KeychainSecretStore {
    pub fn new(service_name: impl Into<String>) -> Self {
        Self {
            service_name: service_name.into(),
        }
    }

    #[cfg(target_os = "macos")]
    fn entry(&self, account_id: &str) -> Result<keyring::Entry> {
        keyring::Entry::new(&self.service_name, account_id)
            .with_context(|| format!("failed to create keychain entry for account `{account_id}`"))
    }
}

#[cfg(target_os = "macos")]
impl SecretStore for KeychainSecretStore {
    fn save_api_key(&self, account_id: &str, api_key: &str) -> Result<()> {
        self.entry(account_id)?
            .set_password(api_key)
            .with_context(|| format!("failed to save API key for account `{account_id}`"))?;
        Ok(())
    }

    fn load_api_key(&self, account_id: &str) -> Result<Option<String>> {
        match self.entry(account_id)?.get_password() {
            Ok(password) => Ok(Some(password)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(error) => Err(error)
                .with_context(|| format!("failed to read API key for account `{account_id}`")),
        }
    }

    fn delete_api_key(&self, account_id: &str) -> Result<()> {
        match self.entry(account_id)?.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(error) => {
                Err(error).with_context(|| format!("failed to delete API key for account `{account_id}`"))
            }
        }
    }
}

#[cfg(not(target_os = "macos"))]
impl SecretStore for KeychainSecretStore {
    fn save_api_key(&self, _account_id: &str, _api_key: &str) -> Result<()> {
        anyhow::bail!("keychain secret store is not configured for this platform")
    }

    fn load_api_key(&self, _account_id: &str) -> Result<Option<String>> {
        anyhow::bail!("keychain secret store is not configured for this platform")
    }

    fn delete_api_key(&self, _account_id: &str) -> Result<()> {
        anyhow::bail!("keychain secret store is not configured for this platform")
    }
}

#[derive(Clone, Debug, Default)]
pub struct MemorySecretStore {
    inner: Arc<Mutex<HashMap<String, String>>>,
}

impl SecretStore for MemorySecretStore {
    fn save_api_key(&self, account_id: &str, api_key: &str) -> Result<()> {
        self.inner
            .lock()
            .expect("memory secret store lock should not be poisoned")
            .insert(account_id.to_string(), api_key.to_string());
        Ok(())
    }

    fn load_api_key(&self, account_id: &str) -> Result<Option<String>> {
        Ok(self
            .inner
            .lock()
            .expect("memory secret store lock should not be poisoned")
            .get(account_id)
            .cloned())
    }

    fn delete_api_key(&self, account_id: &str) -> Result<()> {
        self.inner
            .lock()
            .expect("memory secret store lock should not be poisoned")
            .remove(account_id);
        Ok(())
    }
}
