use rusqlite::Connection;
use tempfile::tempdir;

use tauri_app_lib::db::bootstrap_database_at;

#[test]
fn bootstrap_database_creates_storage_and_core_tables() {
    let tempdir = tempdir().expect("tempdir");
    let data_dir = tempdir.path().join("app-local-data");

    let db_path = bootstrap_database_at(&data_dir).expect("bootstrap database");

    assert!(data_dir.exists(), "app local data dir should exist");
    assert!(db_path.exists(), "sqlite database file should exist");

    let connection = Connection::open(&db_path).expect("open sqlite file");
    let tables = ["accounts", "sync_state", "logs", "sync_jobs"];

    for table in tables {
        let count: i64 = connection
            .query_row(
                "SELECT COUNT(1) FROM sqlite_master WHERE type = 'table' AND name = ?1",
                [table],
                |row| row.get(0),
            )
            .expect("query sqlite_master for table");

        assert_eq!(count, 1, "expected table `{table}` to exist");
    }
}
