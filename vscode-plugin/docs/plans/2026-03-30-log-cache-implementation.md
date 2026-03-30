# Log Cache Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a local SQLite-backed cache for logs so the extension can serve recent data from disk and only sync the newest remote pages when refreshing.

**Architecture:** The extension host owns a `LogCache` service backed by `sql.js`, stored under `globalStorageUri`. API requests become sync operations that upsert remote pages into the cache, and UI state reads from the cache result instead of directly from remote pages.

**Tech Stack:** TypeScript, VS Code Extension API, sql.js, Vitest, Bun

---

### Task 1: Add failing tests for multi-page aggregation and cache-backed loading

**Files:**
- Modify: `src/services/apiClient.test.ts`
- Create: `src/services/logCache.test.ts`
- Modify: `src/provider/dashboardViewProvider.test.ts`

### Task 2: Implement SQLite cache service

**Files:**
- Modify: `package.json`
- Create: `src/services/logCache.ts`
- Create: `src/types/cache.ts`

### Task 3: Integrate cache into provider refresh and load-more flows

**Files:**
- Modify: `src/provider/dashboardViewProvider.ts`
- Modify: `src/extension.ts`
- Modify: `src/state/dashboardState.ts`

### Task 4: Verify Webview loading states still behave correctly

**Files:**
- Modify: `webview-ui/src/App.vue`
- Modify: `webview-ui/src/components/ChartPanel.vue`
- Modify: `webview-ui/src/App.test.ts`

### Task 5: Final verification

**Commands:**
- `bun run test`
- `bun run test:webview`
- `bun run test:extension`
- `bun run package:vsix`
