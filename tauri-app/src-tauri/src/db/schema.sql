CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key TEXT,
  enabled INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_used_at TEXT
);

CREATE TABLE IF NOT EXISTS sync_state (
  account_id TEXT PRIMARY KEY,
  full_sync_completed INTEGER NOT NULL DEFAULT 0,
  last_full_sync_at TEXT,
  last_incremental_sync_at TEXT,
  last_successful_sync_at TEXT,
  latest_log_time TEXT,
  latest_log_fingerprint TEXT,
  last_scanned_page INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT NOT NULL,
  remote_log_id TEXT,
  log_fingerprint TEXT NOT NULL,
  model_name TEXT,
  reasoning TEXT,
  total_cost_usd REAL,
  total_tokens INTEGER,
  created_at TEXT NOT NULL,
  raw_json TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS logs_account_remote_id_idx
  ON logs(account_id, remote_log_id);

CREATE UNIQUE INDEX IF NOT EXISTS logs_account_fingerprint_idx
  ON logs(account_id, log_fingerprint);

CREATE INDEX IF NOT EXISTS logs_account_created_at_idx
  ON logs(account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sync_jobs (
  job_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  scanned_pages INTEGER NOT NULL DEFAULT 0,
  inserted_rows INTEGER NOT NULL DEFAULT 0,
  updated_rows INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
