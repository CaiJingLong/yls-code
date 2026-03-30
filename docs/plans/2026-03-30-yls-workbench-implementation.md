# YLS Desktop Workbench Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the active VS Code plugin project with a Tauri desktop workbench for YLS usage, while archiving the current plugin code under `vscode-plugin/`.

**Architecture:** Keep the repository root as the project container, archive the plugin source into `vscode-plugin/`, and build the active product inside `tauri-app/`. The Tauri Rust backend owns API access, SQLite storage, sync orchestration, and progress events; the Vue frontend renders only local-query results and user controls.

**Tech Stack:** Tauri v2, Vue 3, TypeScript, Vite, Bun, Rust, `rusqlite`, `reqwest`, `serde`, `tokio`, Vitest, Rust integration tests

---

### Task 1: Archive the current VS Code plugin and reshape the repository root

**Files:**
- Create: `vscode-plugin/`
- Move: `CHANGELOG.md`
- Move: `README.md`
- Move: `bun.lock`
- Move: `esbuild.mjs`
- Move: `package.json`
- Move: `resources/`
- Move: `src/`
- Move: `webview-ui/`
- Move: `docs/plans/2026-03-29-vscode-usage-dashboard-design.md`
- Move: `docs/plans/2026-03-29-vscode-usage-dashboard.md`
- Move: `docs/plans/2026-03-29-dashboard-ux-iteration.md`
- Move: `docs/plans/2026-03-30-log-cache-design.md`
- Move: `docs/plans/2026-03-30-log-cache-implementation.md`
- Create: `README.md`
- Create: `package.json`
- Modify: `.gitignore`

**Step 1: Add a repository smoke check**

- Create a lightweight root verification script, for example `scripts/verify-repo-layout.mjs`
- Assert the repository contains `vscode-plugin/`, `tauri-app/`, root `README.md`, and root `package.json`
- Assert generated folders such as `dist/`, `.vscode-test/`, and `node_modules/` are not moved into the archive

**Step 2: Run the smoke check to verify it fails**

Run: `bun run verify:repo-layout`
Expected: FAIL because `vscode-plugin/` and `tauri-app/` do not exist yet

**Step 3: Perform the archive move and add new root metadata**

- Move the active plugin source tree into `vscode-plugin/`
- Create a new root `README.md` explaining:
  - the plugin is archived
  - the active product is `tauri-app/`
  - how to enter the new app during development
- Create a new root `package.json` with proxy scripts such as:
  - `dev`
  - `build`
  - `test`
  - `verify:repo-layout`
- Update `.gitignore` so generated Tauri artifacts are ignored at the new locations

**Step 4: Run the smoke check to verify it passes**

Run: `bun run verify:repo-layout`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add README.md package.json .gitignore scripts/verify-repo-layout.mjs vscode-plugin docs/plans
git commit -m "chore: 归档 VS Code 插件并重组仓库结构"
```

### Task 2: Scaffold the Tauri app and wire root scripts

**Files:**
- Create: `tauri-app/`
- Create: `tauri-app/package.json`
- Create: `tauri-app/vite.config.ts`
- Create: `tauri-app/tsconfig.json`
- Create: `tauri-app/index.html`
- Create: `tauri-app/src/main.ts`
- Create: `tauri-app/src/App.vue`
- Create: `tauri-app/src/styles/app.css`
- Create: `tauri-app/src-tauri/Cargo.toml`
- Create: `tauri-app/src-tauri/tauri.conf.json`
- Create: `tauri-app/src-tauri/src/main.rs`
- Modify: root `package.json`
- Modify: root `README.md`

**Step 1: Add a shell-level smoke test**

- Create `tauri-app/src/App.test.ts`
- Assert the app shell renders a placeholder navigation region and current app title

**Step 2: Run the frontend shell test to verify it fails**

Run: `bun --cwd tauri-app test src/App.test.ts`
Expected: FAIL because the Tauri app is not scaffolded yet

**Step 3: Create the Tauri Vue TypeScript shell**

- Initialize `tauri-app/` with the official Tauri v2 Vue TypeScript setup using `bun`
- Add root proxy scripts:
  - `bun run dev` -> `bun --cwd tauri-app tauri dev`
  - `bun run build` -> `bun --cwd tauri-app tauri build`
  - `bun run test` -> frontend and Rust tests
- Replace starter content with a minimal app shell that matches the test

**Step 4: Run the frontend shell test and Tauri config checks**

Run: `bun --cwd tauri-app test src/App.test.ts`
Expected: PASS

Run: `cargo check --manifest-path tauri-app/src-tauri/Cargo.toml`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add README.md package.json tauri-app
git commit -m "feat: 初始化 Tauri 桌面应用骨架"
```

### Task 3: Establish Rust app state, SQLite schema, and persistence bootstrap

**Files:**
- Create: `tauri-app/src-tauri/src/lib.rs`
- Create: `tauri-app/src-tauri/src/app_state.rs`
- Create: `tauri-app/src-tauri/src/db/mod.rs`
- Create: `tauri-app/src-tauri/src/db/schema.sql`
- Create: `tauri-app/src-tauri/src/db/migrations.rs`
- Create: `tauri-app/src-tauri/src/db/connection.rs`
- Create: `tauri-app/src-tauri/src/models/account.rs`
- Create: `tauri-app/src-tauri/src/models/log_entry.rs`
- Create: `tauri-app/src-tauri/tests/db_bootstrap.rs`
- Modify: `tauri-app/src-tauri/Cargo.toml`
- Modify: `tauri-app/src-tauri/src/main.rs`

**Step 1: Write the failing database bootstrap test**

- In `db_bootstrap.rs`, assert app startup can:
  - create the app local data directory
  - create the SQLite database file
  - run schema setup for `accounts`, `sync_state`, `logs`, and `sync_jobs`

**Step 2: Run the Rust test to verify it fails**

Run: `cargo test --manifest-path tauri-app/src-tauri/Cargo.toml db_bootstrap`
Expected: FAIL because no database bootstrap exists yet

**Step 3: Implement the bootstrap path**

- Add `rusqlite` and startup wiring
- Create a connection factory rooted in the Tauri local app data directory
- Load and apply `schema.sql`
- Register shared app state so later commands can reuse the connection path safely

**Step 4: Run the Rust test to verify it passes**

Run: `cargo test --manifest-path tauri-app/src-tauri/Cargo.toml db_bootstrap`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add tauri-app/src-tauri
git commit -m "feat: 建立桌面端 SQLite 持久化基础"
```

### Task 4: Add account metadata and secure API key storage

**Files:**
- Create: `tauri-app/src-tauri/src/services/account_service.rs`
- Create: `tauri-app/src-tauri/src/services/secret_store.rs`
- Create: `tauri-app/src-tauri/src/commands/accounts.rs`
- Create: `tauri-app/src-tauri/tests/account_commands.rs`
- Create: `tauri-app/src/types/accounts.ts`
- Create: `tauri-app/src/lib/tauri/accounts.ts`
- Modify: `tauri-app/src-tauri/src/lib.rs`
- Modify: `tauri-app/src-tauri/src/main.rs`
- Modify: `tauri-app/src-tauri/Cargo.toml`

**Step 1: Write the failing account command tests**

- Assert `save_account` stores account metadata in SQLite
- Assert API key material is written through the secure secret store, not SQLite
- Assert `list_accounts` returns sanitized account data only
- Assert disable and delete flows preserve or remove local state as designed

**Step 2: Run the Rust tests to verify they fail**

Run: `cargo test --manifest-path tauri-app/src-tauri/Cargo.toml account_commands`
Expected: FAIL because account commands do not exist yet

**Step 3: Implement account and secret handling**

- Use a secure local secret storage backend for API key material
- Keep SQLite limited to account metadata and sync state
- Add Tauri commands for create, update, list, enable, disable, delete, and select-current-account
- Add TypeScript wrappers so the frontend never constructs raw invoke payloads inline

**Step 4: Run the Rust tests to verify they pass**

Run: `cargo test --manifest-path tauri-app/src-tauri/Cargo.toml account_commands`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add tauri-app/src-tauri tauri-app/src
git commit -m "feat: 新增账号管理与安全密钥存储"
```

### Task 5: Implement the YLS client, log normalization, and deduplication rules

**Files:**
- Create: `tauri-app/src-tauri/src/services/yls_client.rs`
- Create: `tauri-app/src-tauri/src/services/log_normalizer.rs`
- Create: `tauri-app/src-tauri/src/services/log_fingerprint.rs`
- Create: `tauri-app/src-tauri/tests/yls_client.rs`
- Create: `tauri-app/src-tauri/tests/log_fingerprint.rs`
- Modify: `tauri-app/src-tauri/Cargo.toml`

**Step 1: Write the failing API and fingerprint tests**

- Mock the YLS `/codex/info` and `/codex/logs` responses
- Assert the client sends `Authorization: Bearer <apiKey>`
- Assert raw responses normalize into stable local log records
- Assert fingerprint generation is deterministic when remote IDs are missing

**Step 2: Run the Rust tests to verify they fail**

Run: `cargo test --manifest-path tauri-app/src-tauri/Cargo.toml yls_client log_fingerprint`
Expected: FAIL because the client and fingerprint services do not exist yet

**Step 3: Implement the API client and normalizer**

- Add a typed `reqwest` client for YLS endpoints
- Normalize fields needed by local storage and charts
- Prefer remote log IDs when present, and fall back to deterministic fingerprints otherwise

**Step 4: Run the Rust tests to verify they pass**

Run: `cargo test --manifest-path tauri-app/src-tauri/Cargo.toml yls_client log_fingerprint`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add tauri-app/src-tauri
git commit -m "feat: 新增 YLS 接口客户端与日志归一化"
```

### Task 6: Build the full-sync and incremental-sync engine with progress events

**Files:**
- Create: `tauri-app/src-tauri/src/services/sync_engine.rs`
- Create: `tauri-app/src-tauri/src/services/sync_progress.rs`
- Create: `tauri-app/src-tauri/src/commands/sync.rs`
- Create: `tauri-app/src-tauri/src/events.rs`
- Create: `tauri-app/src-tauri/tests/full_sync.rs`
- Create: `tauri-app/src-tauri/tests/incremental_sync.rs`
- Modify: `tauri-app/src-tauri/src/db/mod.rs`
- Modify: `tauri-app/src-tauri/src/services/account_service.rs`
- Modify: `tauri-app/src-tauri/src/lib.rs`

**Step 1: Write the failing sync tests**

- Assert first-time sync fetches `page=1..N` with `page_size=200` until no more records remain
- Assert overlapping pages do not insert duplicate rows
- Assert incremental sync stops when a page contains only known records
- Assert concurrent sync for the same account is rejected
- Assert progress events include job kind, scanned pages, inserted rows, and status

**Step 2: Run the Rust tests to verify they fail**

Run: `cargo test --manifest-path tauri-app/src-tauri/Cargo.toml full_sync incremental_sync`
Expected: FAIL because no sync engine exists yet

**Step 3: Implement the sync engine**

- Add job lifecycle tracking in `sync_jobs`
- Implement resumable full sync
- Implement incremental sync from the newest pages forward
- Emit Tauri events after page fetches and state transitions
- Ensure UI-facing reads still come from SQLite queries only

**Step 4: Run the Rust tests to verify they pass**

Run: `cargo test --manifest-path tauri-app/src-tauri/Cargo.toml full_sync incremental_sync`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add tauri-app/src-tauri
git commit -m "feat: 实现日志全量同步与增量同步引擎"
```

### Task 7: Add query services for overview, logs, and analytics

**Files:**
- Create: `tauri-app/src-tauri/src/services/query_service.rs`
- Create: `tauri-app/src-tauri/src/commands/query.rs`
- Create: `tauri-app/src-tauri/tests/query_overview.rs`
- Create: `tauri-app/src-tauri/tests/query_logs.rs`
- Create: `tauri-app/src-tauri/tests/query_analytics.rs`
- Create: `tauri-app/src/types/query.ts`
- Create: `tauri-app/src/lib/tauri/query.ts`
- Modify: `tauri-app/src-tauri/src/lib.rs`

**Step 1: Write the failing query tests**

- Assert overview queries return account summary and sync metadata
- Assert logs queries support pagination, keyword search, model filter, and time range filter
- Assert analytics queries aggregate by model and by hour or day
- Assert model cost breakdown uses model names rather than placeholder labels

**Step 2: Run the Rust tests to verify they fail**

Run: `cargo test --manifest-path tauri-app/src-tauri/Cargo.toml query_overview query_logs query_analytics`
Expected: FAIL because query services do not exist yet

**Step 3: Implement the query services and command bridge**

- Build SQL queries for overview cards
- Build filtered log list queries against SQLite
- Build aggregation queries for charts and rankings
- Expose stable Tauri commands plus TypeScript wrappers

**Step 4: Run the Rust tests to verify they pass**

Run: `cargo test --manifest-path tauri-app/src-tauri/Cargo.toml query_overview query_logs query_analytics`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add tauri-app/src-tauri tauri-app/src
git commit -m "feat: 新增本地查询层与统计聚合接口"
```

### Task 8: Build the Vue shell, routing, preferences, and sync state stores

**Files:**
- Create: `tauri-app/src/router/index.ts`
- Create: `tauri-app/src/stores/app.ts`
- Create: `tauri-app/src/stores/accounts.ts`
- Create: `tauri-app/src/stores/sync.ts`
- Create: `tauri-app/src/stores/preferences.ts`
- Create: `tauri-app/src/components/layout/AppShell.vue`
- Create: `tauri-app/src/components/layout/SidebarNav.vue`
- Create: `tauri-app/src/components/layout/TopBar.vue`
- Create: `tauri-app/src/composables/useResolvedTheme.ts`
- Create: `tauri-app/src/App.test.ts`
- Modify: `tauri-app/src/App.vue`
- Modify: `tauri-app/src/main.ts`
- Modify: `tauri-app/src/styles/app.css`

**Step 1: Write the failing frontend shell tests**

- Assert the app renders pages for `Overview`, `Logs`, `Analytics`, and `Keys`
- Assert the top bar contains account switch, sync action, polling control, and theme mode control
- Assert theme resolution follows `system | light | dark`
- Assert sync progress state can be rendered without live network data

**Step 2: Run the frontend tests to verify they fail**

Run: `bun --cwd tauri-app test src/App.test.ts`
Expected: FAIL because the shell and stores do not exist yet

**Step 3: Implement the shell and stores**

- Add router and primary layouts
- Add centralized state for account selection, sync status, and preferences
- Add event listeners for backend sync progress
- Ensure the shell can render from cached query results without blocking on sync completion

**Step 4: Run the frontend tests to verify they pass**

Run: `bun --cwd tauri-app test src/App.test.ts`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add tauri-app/src
git commit -m "feat: 搭建桌面工作台前端骨架与全局状态"
```

### Task 9: Rebuild the overview, logs, analytics, and keys screens

**Files:**
- Create: `tauri-app/src/pages/OverviewPage.vue`
- Create: `tauri-app/src/pages/LogsPage.vue`
- Create: `tauri-app/src/pages/AnalyticsPage.vue`
- Create: `tauri-app/src/pages/KeysPage.vue`
- Create: `tauri-app/src/components/cards/SummaryCard.vue`
- Create: `tauri-app/src/components/charts/ChartPanel.vue`
- Create: `tauri-app/src/components/charts/ModelCostPie.vue`
- Create: `tauri-app/src/components/charts/CostTrendChart.vue`
- Create: `tauri-app/src/components/logs/LogsFilterBar.vue`
- Create: `tauri-app/src/components/logs/LogsTable.vue`
- Create: `tauri-app/src/components/keys/AccountForm.vue`
- Create: `tauri-app/src/charts/modelCost.ts`
- Create: `tauri-app/src/charts/costTrend.ts`
- Create: `tauri-app/src/pages/OverviewPage.test.ts`
- Create: `tauri-app/src/pages/LogsPage.test.ts`
- Create: `tauri-app/src/pages/AnalyticsPage.test.ts`
- Create: `tauri-app/src/pages/KeysPage.test.ts`

**Step 1: Write the failing page tests**

- Assert overview charts render only after local query data arrives, not with fake empty series
- Assert logs page can filter and paginate local rows
- Assert analytics page can switch hour and day granularity
- Assert keys page can add or edit accounts and show per-key sync status

**Step 2: Run the frontend page tests to verify they fail**

Run: `bun --cwd tauri-app test src/pages`
Expected: FAIL because the screens do not exist yet

**Step 3: Implement the screens**

- Migrate the reusable chart logic from the archived plugin into the new app
- Bind each page to the TypeScript command wrappers
- Keep chart adapters separate from page components
- Avoid rendering charts with placeholder empty datasets while upstream local queries are still loading

**Step 4: Run the frontend page tests to verify they pass**

Run: `bun --cwd tauri-app test src/pages`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add tauri-app/src
git commit -m "feat: 完成工作台核心页面与图表重建"
```

### Task 10: Finish build scripts, packaging docs, and end-to-end verification

**Files:**
- Modify: root `README.md`
- Modify: root `package.json`
- Modify: `tauri-app/package.json`
- Create: `tauri-app/src-tauri/tests/smoke_sync.rs`
- Create: `docs/plans/2026-03-30-yls-workbench-release-checklist.md`

**Step 1: Write the failing verification coverage**

- Add a Rust smoke test that seeds a mock account, runs sync, and verifies overview data can be queried
- Add README assertions to the release checklist:
  - local dev command
  - build command
  - test command
  - packaged app location

**Step 2: Run the verification commands to verify gaps remain**

Run: `cargo test --manifest-path tauri-app/src-tauri/Cargo.toml smoke_sync`
Expected: FAIL because the smoke path is not implemented yet

Run: `bun run build`
Expected: PASS only after all app scripts are wired correctly

**Step 3: Implement final scripts and docs**

- Add root and app-level build scripts for development, tests, and packaging
- Document where the packaged app is generated and how to run it locally
- Add any missing release checklist items for local verification

**Step 4: Run the full verification suite**

Run: `bun run test`
Expected: PASS

Run: `cargo test --manifest-path tauri-app/src-tauri/Cargo.toml`
Expected: PASS

Run: `bun --cwd tauri-app run build`
Expected: PASS

Run: `bun --cwd tauri-app tauri build`
Expected: PASS

**Step 5: Commit**

Run:

```bash
git add README.md package.json tauri-app docs/plans
git commit -m "build: 完善桌面应用构建脚本与发布说明"
```
