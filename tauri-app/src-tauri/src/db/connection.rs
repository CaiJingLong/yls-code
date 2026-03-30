use std::{
    fs,
    path::{Path, PathBuf},
};

use anyhow::{Context, Result};
use rusqlite::Connection;

use super::DATABASE_FILE_NAME;

pub fn open_database(data_dir: &Path) -> Result<(Connection, PathBuf)> {
    fs::create_dir_all(data_dir)
        .with_context(|| format!("failed to create app data dir at {}", data_dir.display()))?;

    let db_path = data_dir.join(DATABASE_FILE_NAME);
    let connection = Connection::open(&db_path)
        .with_context(|| format!("failed to open sqlite database at {}", db_path.display()))?;

    Ok((connection, db_path))
}
