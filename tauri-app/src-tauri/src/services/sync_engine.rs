use anyhow::{bail, Context, Result};
use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

use crate::app_state::AppState;

use super::{
    account_service::AccountService,
    log_fingerprint::fingerprint_log,
    log_normalizer::{normalize_log_item, NormalizedLogRecord},
    sync_progress::{SyncKind, SyncProgressEvent, SyncStatus},
    yls_client::{YlsClient, YlsCodexLogItem, REMOTE_PAGE_SIZE_LIMIT},
};

pub struct SyncEngine;

impl SyncEngine {
    pub fn sync_account<F>(
        state: &AppState,
        account_id: &str,
        kind: SyncKind,
        mut reporter: F,
    ) -> Result<()>
    where
        F: FnMut(SyncProgressEvent) -> Result<()>,
    {
        let _guard = SyncGuard::claim(state, account_id)?;
        let (base_url, api_key) = AccountService::load_account_sync_credentials(state, account_id)?;
        let connection = Connection::open(&state.db_path).with_context(|| {
            format!(
                "failed to open sqlite database at {}",
                state.db_path.display()
            )
        })?;
        let client = YlsClient::new(base_url, api_key);
        let job_id = Uuid::new_v4().to_string();

        Self::create_job(&connection, &job_id, account_id, kind)?;
        reporter(SyncProgressEvent {
            account_id: account_id.to_string(),
            job_id: job_id.clone(),
            kind,
            status: SyncStatus::Running,
            scanned_pages: 0,
            inserted_rows: 0,
            updated_rows: 0,
            message: None,
        })?;

        let sync_result = match kind {
            SyncKind::Full => Self::run_full_sync(&connection, &client, account_id, &job_id, &mut reporter),
            SyncKind::Incremental => {
                Self::run_incremental_sync(&connection, &client, account_id, &job_id, &mut reporter)
            }
        };

        match sync_result {
            Ok(summary) => {
                Self::mark_job_completed(&connection, &job_id, summary.scanned_pages, summary.inserted_rows, summary.updated_rows)?;
                Self::update_sync_state_success(&connection, account_id, kind, summary.scanned_pages)?;
                reporter(SyncProgressEvent {
                    account_id: account_id.to_string(),
                    job_id,
                    kind,
                    status: SyncStatus::Completed,
                    scanned_pages: summary.scanned_pages,
                    inserted_rows: summary.inserted_rows,
                    updated_rows: summary.updated_rows,
                    message: None,
                })?;
                Ok(())
            }
            Err(error) => {
                let message = error.to_string();
                let _ = Self::mark_job_failed(&connection, &job_id, &message);
                let _ = Self::update_sync_state_failure(&connection, account_id, &message);
                let _ = reporter(SyncProgressEvent {
                    account_id: account_id.to_string(),
                    job_id,
                    kind,
                    status: SyncStatus::Failed,
                    scanned_pages: 0,
                    inserted_rows: 0,
                    updated_rows: 0,
                    message: Some(message.clone()),
                });
                Err(error)
            }
        }
    }

    fn run_full_sync<F>(
        connection: &Connection,
        client: &YlsClient,
        account_id: &str,
        job_id: &str,
        reporter: &mut F,
    ) -> Result<SyncSummary>
    where
        F: FnMut(SyncProgressEvent) -> Result<()>,
    {
        let mut page = 1;
        let mut scanned_pages = 0;
        let mut inserted_rows = 0;
        let mut updated_rows = 0;

        loop {
            let response = client.fetch_logs(page, REMOTE_PAGE_SIZE_LIMIT)?;
            let page_items = response.data.items;
            let page_size = response.data.page_size.max(1);
            let (page_inserted, page_updated) =
                Self::persist_logs(connection, account_id, page_items.clone())?;

            scanned_pages += 1;
            inserted_rows += page_inserted;
            updated_rows += page_updated;

            Self::update_job_progress(connection, job_id, scanned_pages, inserted_rows, updated_rows)?;
            reporter(SyncProgressEvent {
                account_id: account_id.to_string(),
                job_id: job_id.to_string(),
                kind: SyncKind::Full,
                status: SyncStatus::Running,
                scanned_pages,
                inserted_rows,
                updated_rows,
                message: None,
            })?;

            let reached_end = page_items.len() < page_size as usize
                || response.data.page.saturating_mul(page_size) >= response.data.total;

            if reached_end {
                break;
            }

            page += 1;
        }

        Ok(SyncSummary {
            scanned_pages,
            inserted_rows,
            updated_rows,
        })
    }

    fn run_incremental_sync<F>(
        connection: &Connection,
        client: &YlsClient,
        account_id: &str,
        job_id: &str,
        reporter: &mut F,
    ) -> Result<SyncSummary>
    where
        F: FnMut(SyncProgressEvent) -> Result<()>,
    {
        let mut page = 1;
        let mut scanned_pages = 0;
        let mut inserted_rows = 0;
        let mut updated_rows = 0;

        loop {
            let response = client.fetch_logs(page, REMOTE_PAGE_SIZE_LIMIT)?;
            let page_items = response.data.items;
            let page_size = response.data.page_size.max(1);
            let (page_inserted, page_updated) =
                Self::persist_logs(connection, account_id, page_items.clone())?;

            scanned_pages += 1;
            inserted_rows += page_inserted;
            updated_rows += page_updated;

            Self::update_job_progress(connection, job_id, scanned_pages, inserted_rows, updated_rows)?;
            reporter(SyncProgressEvent {
                account_id: account_id.to_string(),
                job_id: job_id.to_string(),
                kind: SyncKind::Incremental,
                status: SyncStatus::Running,
                scanned_pages,
                inserted_rows,
                updated_rows,
                message: None,
            })?;

            let reached_end = page_items.is_empty()
                || page_items.len() < page_size as usize
                || response.data.page.saturating_mul(page_size) >= response.data.total;

            if page_inserted == 0 || reached_end {
                break;
            }

            page += 1;
        }

        Ok(SyncSummary {
            scanned_pages,
            inserted_rows,
            updated_rows,
        })
    }

    fn persist_logs(
        connection: &Connection,
        account_id: &str,
        items: Vec<YlsCodexLogItem>,
    ) -> Result<(u32, u32)> {
        let mut inserted_rows = 0;
        let mut updated_rows = 0;

        for item in items {
            let normalized = normalize_log_item(&item)?;
            let fingerprint = fingerprint_log(&normalized);
            let existed = Self::log_exists(connection, account_id, normalized.remote_log_id.as_deref(), &fingerprint)?;

            if existed {
                Self::update_log(connection, account_id, &normalized, &fingerprint)?;
                updated_rows += 1;
            } else {
                Self::insert_log(connection, account_id, &normalized, &fingerprint)?;
                inserted_rows += 1;
            }
        }

        Ok((inserted_rows, updated_rows))
    }

    fn log_exists(
        connection: &Connection,
        account_id: &str,
        remote_log_id: Option<&str>,
        fingerprint: &str,
    ) -> Result<bool> {
        if let Some(remote_log_id) = remote_log_id {
            let exists = connection
                .query_row(
                    "SELECT 1 FROM logs WHERE account_id = ?1 AND remote_log_id = ?2 LIMIT 1",
                    params![account_id, remote_log_id],
                    |_| Ok(()),
                )
                .optional()?
                .is_some();

            if exists {
                return Ok(true);
            }
        }

        Ok(connection
            .query_row(
                "SELECT 1 FROM logs WHERE account_id = ?1 AND log_fingerprint = ?2 LIMIT 1",
                params![account_id, fingerprint],
                |_| Ok(()),
            )
            .optional()?
            .is_some())
    }

    fn insert_log(
        connection: &Connection,
        account_id: &str,
        log: &NormalizedLogRecord,
        fingerprint: &str,
    ) -> Result<()> {
        connection.execute(
            "INSERT INTO logs (
                account_id, remote_log_id, log_fingerprint, model_name, reasoning,
                total_cost_usd, total_tokens, created_at, raw_json
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                account_id,
                log.remote_log_id,
                fingerprint,
                log.model_name,
                log.reasoning,
                log.total_cost_usd,
                log.total_tokens,
                log.created_at,
                log.raw_json,
            ],
        )?;

        Ok(())
    }

    fn update_log(
        connection: &Connection,
        account_id: &str,
        log: &NormalizedLogRecord,
        fingerprint: &str,
    ) -> Result<()> {
        if let Some(remote_log_id) = &log.remote_log_id {
            connection.execute(
                "UPDATE logs
                 SET model_name = ?3, reasoning = ?4, total_cost_usd = ?5,
                     total_tokens = ?6, created_at = ?7, raw_json = ?8, log_fingerprint = ?9
                 WHERE account_id = ?1 AND remote_log_id = ?2",
                params![
                    account_id,
                    remote_log_id,
                    log.model_name,
                    log.reasoning,
                    log.total_cost_usd,
                    log.total_tokens,
                    log.created_at,
                    log.raw_json,
                    fingerprint,
                ],
            )?;
        } else {
            connection.execute(
                "UPDATE logs
                 SET model_name = ?3, reasoning = ?4, total_cost_usd = ?5,
                     total_tokens = ?6, created_at = ?7, raw_json = ?8
                 WHERE account_id = ?1 AND log_fingerprint = ?2",
                params![
                    account_id,
                    fingerprint,
                    log.model_name,
                    log.reasoning,
                    log.total_cost_usd,
                    log.total_tokens,
                    log.created_at,
                    log.raw_json,
                ],
            )?;
        }

        Ok(())
    }

    fn create_job(connection: &Connection, job_id: &str, account_id: &str, kind: SyncKind) -> Result<()> {
        connection.execute(
            "INSERT INTO sync_jobs (job_id, account_id, kind, status, started_at)
             VALUES (?1, ?2, ?3, 'running', strftime('%s', 'now'))",
            params![job_id, account_id, sync_kind_label(kind)],
        )?;
        Ok(())
    }

    fn update_job_progress(
        connection: &Connection,
        job_id: &str,
        scanned_pages: u32,
        inserted_rows: u32,
        updated_rows: u32,
    ) -> Result<()> {
        connection.execute(
            "UPDATE sync_jobs
             SET scanned_pages = ?2, inserted_rows = ?3, updated_rows = ?4
             WHERE job_id = ?1",
            params![job_id, scanned_pages, inserted_rows, updated_rows],
        )?;
        Ok(())
    }

    fn mark_job_completed(
        connection: &Connection,
        job_id: &str,
        scanned_pages: u32,
        inserted_rows: u32,
        updated_rows: u32,
    ) -> Result<()> {
        connection.execute(
            "UPDATE sync_jobs
             SET status = 'completed',
                 scanned_pages = ?2,
                 inserted_rows = ?3,
                 updated_rows = ?4,
                 finished_at = strftime('%s', 'now')
             WHERE job_id = ?1",
            params![job_id, scanned_pages, inserted_rows, updated_rows],
        )?;
        Ok(())
    }

    fn mark_job_failed(connection: &Connection, job_id: &str, error_message: &str) -> Result<()> {
        connection.execute(
            "UPDATE sync_jobs
             SET status = 'failed',
                 error_message = ?2,
                 finished_at = strftime('%s', 'now')
             WHERE job_id = ?1",
            params![job_id, error_message],
        )?;
        Ok(())
    }

    fn update_sync_state_success(
        connection: &Connection,
        account_id: &str,
        kind: SyncKind,
        scanned_pages: u32,
    ) -> Result<()> {
        let (full_sync_completed, full_sync_at, incremental_sync_at) = match kind {
            SyncKind::Full => (1, Some("strftime('%s', 'now')"), None),
            SyncKind::Incremental => (0, None, Some("strftime('%s', 'now')")),
        };

        let sql = match kind {
            SyncKind::Full => {
                "INSERT INTO sync_state (
                    account_id, full_sync_completed, last_full_sync_at,
                    last_successful_sync_at, last_scanned_page, last_error
                 ) VALUES (?1, 1, strftime('%s', 'now'), strftime('%s', 'now'), ?2, NULL)
                 ON CONFLICT(account_id) DO UPDATE SET
                    full_sync_completed = 1,
                    last_full_sync_at = strftime('%s', 'now'),
                    last_successful_sync_at = strftime('%s', 'now'),
                    last_scanned_page = excluded.last_scanned_page,
                    last_error = NULL"
            }
            SyncKind::Incremental => {
                "INSERT INTO sync_state (
                    account_id, full_sync_completed, last_incremental_sync_at,
                    last_successful_sync_at, last_scanned_page, last_error
                 ) VALUES (?1, 0, strftime('%s', 'now'), strftime('%s', 'now'), ?2, NULL)
                 ON CONFLICT(account_id) DO UPDATE SET
                    last_incremental_sync_at = strftime('%s', 'now'),
                    last_successful_sync_at = strftime('%s', 'now'),
                    last_scanned_page = excluded.last_scanned_page,
                    last_error = NULL"
            }
        };

        let _ = (full_sync_completed, full_sync_at, incremental_sync_at);
        connection.execute(sql, params![account_id, scanned_pages])?;
        Ok(())
    }

    fn update_sync_state_failure(connection: &Connection, account_id: &str, error_message: &str) -> Result<()> {
        connection.execute(
            "INSERT INTO sync_state (account_id, last_error)
             VALUES (?1, ?2)
             ON CONFLICT(account_id) DO UPDATE SET last_error = excluded.last_error",
            params![account_id, error_message],
        )?;
        Ok(())
    }
}

struct SyncSummary {
    scanned_pages: u32,
    inserted_rows: u32,
    updated_rows: u32,
}

struct SyncGuard<'a> {
    state: &'a AppState,
    account_id: String,
}

impl<'a> SyncGuard<'a> {
    fn claim(state: &'a AppState, account_id: &str) -> Result<Self> {
        let mut active_accounts = state
            .active_sync_accounts
            .lock()
            .expect("active sync accounts lock should not be poisoned");

        if !active_accounts.insert(account_id.to_string()) {
            bail!("account `{account_id}` is already syncing");
        }

        Ok(Self {
            state,
            account_id: account_id.to_string(),
        })
    }
}

impl Drop for SyncGuard<'_> {
    fn drop(&mut self) {
        self.state
            .active_sync_accounts
            .lock()
            .expect("active sync accounts lock should not be poisoned")
            .remove(&self.account_id);
    }
}

fn sync_kind_label(kind: SyncKind) -> &'static str {
    match kind {
        SyncKind::Full => "full",
        SyncKind::Incremental => "incremental",
    }
}
