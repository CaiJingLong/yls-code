use std::time::{SystemTime, UNIX_EPOCH};

use anyhow::{Context, Result};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::app_state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveAccountInput {
    pub id: Option<String>,
    pub name: String,
    pub base_url: String,
    pub api_key: String,
    pub enabled: Option<bool>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountSummary {
    pub id: String,
    pub name: String,
    pub base_url: String,
    pub enabled: bool,
    pub created_at: String,
    pub updated_at: String,
    pub last_used_at: Option<String>,
    pub has_api_key: bool,
}

pub struct AccountService;

impl AccountService {
    pub fn save_account(state: &AppState, input: SaveAccountInput) -> Result<AccountSummary> {
        let account_id = input.id.unwrap_or_else(|| Uuid::new_v4().to_string());
        state.secret_store.save_api_key(&account_id, &input.api_key)?;

        let connection = Self::open_connection(state)?;
        let now = current_timestamp();
        let existing_created_at = connection
            .query_row(
                "SELECT created_at FROM accounts WHERE id = ?1",
                [&account_id],
                |row| row.get::<_, String>(0),
            )
            .optional()?;
        let created_at = existing_created_at.unwrap_or_else(|| now.clone());
        let enabled = input.enabled.unwrap_or(true);

        connection.execute(
            "INSERT INTO accounts (
                id, name, base_url, enabled, created_at, updated_at, last_used_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL)
             ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                base_url = excluded.base_url,
                enabled = excluded.enabled,
                updated_at = excluded.updated_at",
            params![
                account_id,
                input.name,
                input.base_url,
                if enabled { 1 } else { 0 },
                created_at,
                now,
            ],
        )?;

        Self::get_account_summary(state, &connection, &account_id)
    }

    pub fn list_accounts(state: &AppState) -> Result<Vec<AccountSummary>> {
        let connection = Self::open_connection(state)?;
        let mut statement = connection.prepare(
            "SELECT id, name, base_url, enabled, created_at, updated_at, last_used_at
             FROM accounts
             ORDER BY updated_at DESC, name ASC",
        )?;

        let rows = statement.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, i64>(3)? != 0,
                row.get::<_, String>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, Option<String>>(6)?,
            ))
        })?;

        let mut accounts = Vec::new();

        for row in rows {
            let (id, name, base_url, enabled, created_at, updated_at, last_used_at) = row?;
            let has_api_key = state.secret_store.load_api_key(&id)?.is_some();
            accounts.push(AccountSummary {
                id,
                name,
                base_url,
                enabled,
                created_at,
                updated_at,
                last_used_at,
                has_api_key,
            });
        }

        Ok(accounts)
    }

    pub fn set_account_enabled(
        state: &AppState,
        account_id: &str,
        enabled: bool,
    ) -> Result<AccountSummary> {
        let connection = Self::open_connection(state)?;
        let updated_at = current_timestamp();

        connection.execute(
            "UPDATE accounts SET enabled = ?2, updated_at = ?3 WHERE id = ?1",
            params![account_id, if enabled { 1 } else { 0 }, updated_at],
        )?;

        Self::get_account_summary(state, &connection, account_id)
    }

    pub fn delete_account(state: &AppState, account_id: &str) -> Result<()> {
        let connection = Self::open_connection(state)?;

        connection.execute("DELETE FROM sync_jobs WHERE account_id = ?1", [account_id])?;
        connection.execute("DELETE FROM sync_state WHERE account_id = ?1", [account_id])?;
        connection.execute("DELETE FROM logs WHERE account_id = ?1", [account_id])?;
        connection.execute("DELETE FROM accounts WHERE id = ?1", [account_id])?;
        state.secret_store.delete_api_key(account_id)?;

        Ok(())
    }

    fn get_account_summary(
        state: &AppState,
        connection: &Connection,
        account_id: &str,
    ) -> Result<AccountSummary> {
        let summary = connection
            .query_row(
                "SELECT id, name, base_url, enabled, created_at, updated_at, last_used_at
                 FROM accounts
                 WHERE id = ?1",
                [account_id],
                |row| {
                    Ok(AccountSummary {
                        id: row.get(0)?,
                        name: row.get(1)?,
                        base_url: row.get(2)?,
                        enabled: row.get::<_, i64>(3)? != 0,
                        created_at: row.get(4)?,
                        updated_at: row.get(5)?,
                        last_used_at: row.get(6)?,
                        has_api_key: false,
                    })
                },
            )
            .optional()?
            .with_context(|| format!("account `{account_id}` was not found"))?;

        Ok(AccountSummary {
            has_api_key: state.secret_store.load_api_key(account_id)?.is_some(),
            ..summary
        })
    }

    fn open_connection(state: &AppState) -> Result<Connection> {
        Connection::open(&state.db_path).with_context(|| {
            format!(
                "failed to open sqlite database at {}",
                state.db_path.display()
            )
        })
    }
}

fn current_timestamp() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system clock should be after unix epoch")
        .as_secs()
        .to_string()
}
