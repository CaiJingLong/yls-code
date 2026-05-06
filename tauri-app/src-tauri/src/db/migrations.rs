use anyhow::{Context, Result};
use rusqlite::{params, Connection, OptionalExtension};

const SCHEMA_SQL: &str = include_str!("schema.sql");

pub fn apply_schema(connection: &Connection) -> Result<()> {
    connection
        .execute_batch(SCHEMA_SQL)
        .context("failed to apply sqlite schema")?;
    ensure_accounts_api_key_column(connection)?;
    Ok(())
}

fn ensure_accounts_api_key_column(connection: &Connection) -> Result<()> {
    let has_api_key_column = connection
        .query_row(
            "SELECT 1
             FROM pragma_table_info('accounts')
             WHERE name = 'api_key'
             LIMIT 1",
            [],
            |row| row.get::<_, i64>(0),
        )
        .optional()?
        .is_some();
    if has_api_key_column {
        return Ok(());
    }

    connection
        .execute("ALTER TABLE accounts ADD COLUMN api_key TEXT", [])
        .context("failed to add accounts.api_key column")?;
    Ok(())
}

pub fn get_meta_value(connection: &Connection, key: &str) -> Result<Option<String>> {
    connection
        .query_row("SELECT value FROM app_meta WHERE key = ?1", [key], |row| {
            row.get::<_, String>(0)
        })
        .optional()
        .context("failed to query app metadata")
}

pub fn set_meta_value(connection: &Connection, key: &str, value: &str) -> Result<()> {
    connection
        .execute(
            "INSERT INTO app_meta (key, value)
             VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![key, value],
        )
        .context("failed to upsert app metadata")?;
    Ok(())
}
