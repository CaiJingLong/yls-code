pub mod connection;
pub mod migrations;

use std::path::{Path, PathBuf};

use anyhow::Result;

pub const DATABASE_FILE_NAME: &str = "yls-workbench.sqlite3";

pub fn bootstrap_database_at(data_dir: &Path) -> Result<PathBuf> {
    let (connection, db_path) = connection::open_database(data_dir)?;
    migrations::apply_schema(&connection)?;
    Ok(db_path)
}
