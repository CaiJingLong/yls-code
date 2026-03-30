# YLS Desktop Workbench Design

## Background

The repository currently contains an in-progress VS Code extension for viewing YLS Codex usage. The product direction has changed: the extension is being retired in favor of a local desktop application built with Tauri.

The new application is not just a dashboard replacement. It must support:

- YLS-only data access
- Multiple API keys managed on one machine
- Local-first browsing of logs and charts
- SQLite-backed caching
- First-time full sync plus later incremental sync
- Visible sync progress and status
- System-following and manual theme control

The current VS Code plugin implementation and related docs should be preserved as an archive under `vscode-plugin/`.

## Goals

- Build a local desktop workbench for YLS usage data
- Keep all API traffic, pagination, deduplication, and cache writes in the Tauri backend
- Make SQLite the source of truth for logs, analytics, and UI queries
- Support multiple YLS API keys with isolated cache state per account
- Render useful overview, log analysis, and key management screens from local data
- Preserve current plugin work by archiving it into a dedicated subdirectory

## Non-Goals

- No multi-provider support in the first version
- No cloud sync or team-shared database
- No direct frontend access to remote YLS APIs
- No separate long-running daemon outside the Tauri app process
- No attempt to preserve the VS Code plugin as an actively maintained target

## Product Shape

The application is a local `YLS Desktop Workbench` for a single user on a single machine.

Primary capabilities:

- `Overview`
  - Remaining quota, usage summary, recent trend, model cost distribution, sync health
- `Logs`
  - Search, filter, page, inspect local cached logs and raw payloads
- `Analytics`
  - Aggregate cost and token views by model and time bucket
- `Keys`
  - Add, edit, enable, disable, sync, and inspect multiple API keys

Global controls:

- Active account switcher
- Manual sync trigger
- Auto-polling toggle and interval
- Theme mode: `system | light | dark`
- Current sync status and recent sync time

## Technology Choices

- Shell app: `Tauri v2`
- Frontend: `Vue 3 + TypeScript + Vite`
- Package manager: `bun`
- Backend: `Rust`
- Local database: `SQLite`
- Secret storage: Tauri-supported secure local secret storage

Why this stack:

- Tauri provides a native desktop shell with a small runtime and clear separation between UI and privileged operations.
- Vue keeps the current chart-heavy UI migration straightforward.
- Rust is the right place for API orchestration, deduplication, sync state, file paths, and database access.
- SQLite is sufficient and durable for local-first log analysis on one machine.

## Repository Layout

The repository remains the top-level project container.

```text
.
├── .agents/
├── docs/
│   └── plans/
├── vscode-plugin/
└── tauri-app/
```

Archive rules:

- Move current plugin source, tests, docs, and resources into `vscode-plugin/`
- Do not archive generated output such as `dist/`, `.vscode-test/`, `.vsix`, or `node_modules/`
- Add a new root README that explains the archived plugin and the active Tauri app

## High-Level Architecture

The app has four layers:

1. `Vue UI layer`
   - Renders screens, charts, tables, and settings
   - Sends commands to the backend
   - Listens for sync progress events

2. `Tauri command layer`
   - Exposes stable commands such as:
     - `list_accounts`
     - `save_account`
     - `delete_account`
     - `start_sync`
     - `stop_sync`
     - `query_overview`
     - `query_logs`
     - `query_analytics`
     - `get_preferences`
     - `set_preferences`

3. `Rust service layer`
   - Account service
   - Secret service
   - Sync service
   - Query service
   - Event service

4. `SQLite storage layer`
   - Persistent local fact store for logs and sync metadata

Frontend code never calls the remote YLS endpoints directly. The backend owns all network and storage behavior.

## Local Storage Model

SQLite lives under the Tauri app local data directory.

Data is split between:

- `secure secret storage`
  - Stores API key material
- `SQLite`
  - Stores account metadata, sync state, logs, and derived query sources

Proposed core tables:

### accounts

- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `base_url TEXT NOT NULL`
- `enabled INTEGER NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`
- `last_used_at TEXT`

### sync_state

- `account_id TEXT PRIMARY KEY`
- `full_sync_completed INTEGER NOT NULL DEFAULT 0`
- `last_full_sync_at TEXT`
- `last_incremental_sync_at TEXT`
- `last_successful_sync_at TEXT`
- `latest_log_time TEXT`
- `latest_log_fingerprint TEXT`
- `last_scanned_page INTEGER NOT NULL DEFAULT 0`
- `last_error TEXT`

### logs

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `account_id TEXT NOT NULL`
- `remote_log_id TEXT`
- `log_fingerprint TEXT NOT NULL`
- `model_name TEXT`
- `reasoning TEXT`
- `total_cost_usd REAL`
- `total_tokens INTEGER`
- `created_at TEXT NOT NULL`
- `raw_json TEXT NOT NULL`

Indexes:

- unique index on `(account_id, remote_log_id)` when remote IDs are present
- unique index on `(account_id, log_fingerprint)`
- query index on `(account_id, created_at DESC)`
- optional filter indexes on `(account_id, model_name)` and `(account_id, total_cost_usd)`

### sync_jobs

- `job_id TEXT PRIMARY KEY`
- `account_id TEXT NOT NULL`
- `kind TEXT NOT NULL`
- `status TEXT NOT NULL`
- `scanned_pages INTEGER NOT NULL DEFAULT 0`
- `inserted_rows INTEGER NOT NULL DEFAULT 0`
- `updated_rows INTEGER NOT NULL DEFAULT 0`
- `started_at TEXT NOT NULL`
- `finished_at TEXT`
- `error_message TEXT`

## Deduplication Strategy

Preferred identity:

- Use a stable remote log ID if the YLS API provides one

Fallback identity:

- Compute a deterministic fingerprint from the record payload, for example:
  - `created_at`
  - `model_name`
  - `total_tokens`
  - `total_cost_usd`
  - a compact normalized raw payload fragment

Reasoning:

- This protects the cache if the API omits or changes explicit IDs
- It also allows overlapping page fetches during sync without duplicate rows

## Sync Model

The backend owns a single sync engine inside the Tauri process. It is not a separate system daemon.

### Initial full sync

- Start from `page=1`
- Use the remote maximum `page_size=200`
- Fetch page by page
- Deduplicate and upsert into SQLite
- Continue until the API returns no more records
- Persist progress per page so the sync can resume after interruption

### Incremental sync

- Always restart from `page=1`
- Fetch the newest pages first
- Continue while new records are still being discovered
- Stop once a page contains only known records, or another safe stopping condition is reached
- Update sync checkpoints only after successful writes

### UI read path

- UI always queries SQLite
- Remote responses are never rendered directly
- Overview, logs, and analytics all read from the same local source of truth

### Polling

- Auto-polling is per account, default interval `15s`
- Polling triggers incremental sync only
- Concurrent sync for the same account is blocked

## UI Data Flow

On app launch:

1. Load preferences, account list, and current account
2. Query SQLite for cached overview, logs, and analytics
3. Render cached state immediately
4. If the account is enabled and sync is needed, start backend sync
5. Emit progress events while sync runs
6. Re-query SQLite after each meaningful sync milestone

This guarantees that the first render can use cached data and never depends on a lucky remote page payload to populate charts.

## Pages

### Overview

- Account summary cards
- Model cost pie chart using model names
- Cost trend chart with hour/day granularity
- Sync health, last sync time, cache size

### Logs

- Local search and filter controls
- Pagination over SQLite results
- Raw payload inspector
- Columns chosen from normalized log fields, not direct remote JSON coupling

### Analytics

- Model ranking by cost and tokens
- Time bucket aggregation
- Reusable chart adapters for later metrics

### Keys

- Add and edit account metadata
- Save and replace API keys securely
- Enable or disable accounts
- Trigger full rebuild or incremental sync
- Show cache size and sync status per account

## Theme Model

Theme is centralized in app preferences:

- `system`
- `light`
- `dark`

Rules:

- CSS variables and chart theme derive from the same resolved theme state
- System mode follows the operating system theme
- Manual mode overrides system mode

## Error Handling

Errors are surfaced by category:

- Configuration errors
  - missing or invalid API key
- Authentication errors
  - unauthorized or forbidden responses
- Network errors
  - timeout, connectivity, server failures, rate limiting
- Sync errors
  - interrupted sync, inconsistent page payload, checkpoint mismatch
- Storage errors
  - SQLite write failure, corruption, lock problems

Error rules:

- Keep the last successful local data visible
- Never replace cached screens with empty state only because a sync failed
- Mark account sync status explicitly so the user can act on it

## Testing Strategy

### Rust unit tests

- fingerprint generation
- deduplication rules
- full sync stop conditions
- incremental sync stop conditions
- account isolation

### Rust integration tests

- temporary SQLite database plus mock HTTP server
- initial full sync end-to-end
- incremental sync end-to-end
- interruption and resume behavior

### Frontend tests

- page routing and screen state
- theme resolution
- chart adapter output
- sync progress rendering
- account switching and filters

## Migration Plan

The implementation should proceed in this order:

1. Archive the VS Code plugin into `vscode-plugin/`
2. Create the `tauri-app/` shell with `Vue + TypeScript + bun`
3. Establish Rust backend structure and SQLite schema
4. Implement account and secret management
5. Implement full sync and incremental sync engine
6. Build SQLite-backed overview, logs, and analytics queries
7. Rebuild the UI on top of backend commands and events
8. Document run, build, and packaging flows

## Open Constraints To Honor During Implementation

- Keep the repository history intact
- Do not discard existing plugin work
- Do not hardcode API keys
- Prefer reusable chart adapters and normalized models over page-specific logic
- Preserve room for future fields and new chart types without redesigning the storage layer
