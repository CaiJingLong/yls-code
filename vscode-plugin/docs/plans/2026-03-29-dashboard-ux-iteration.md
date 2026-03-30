# Dashboard UX Iteration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reshape the dashboard into overview/log tabs, aggregate charts from logs, and add auto polling with a 15-second default cadence.

**Architecture:** Keep API access in the extension host and move interaction-heavy state such as active tab, trend granularity, and polling toggle into the Webview layer. Derive chart data from loaded logs so model breakdown, hourly/daily trend, and the logs tab all stay consistent with the same source dataset.

**Tech Stack:** TypeScript, VS Code Extension API, Vue 3, Vite, ECharts, Vitest, Bun

---

### Task 1: Lock new data behavior with failing tests

**Files:**
- Modify: `src/manifest.test.ts`
- Create: `src/state/dashboardState.test.ts`
- Modify: `webview-ui/src/App.test.ts`

**Step 1: Write the failing tests**

- Assert `ylsCode.pageSize` defaults to `500`
- Assert model breakdown is aggregated from logs by `model`
- Assert trend data can be aggregated by `hour` and `day`
- Assert the Webview renders tab navigation and can switch to logs view

**Step 2: Run tests to verify they fail**

Run: `bun run test src/manifest.test.ts src/state/dashboardState.test.ts`
Expected: FAIL because config defaults and aggregation helpers do not exist yet

Run: `bun run --cwd webview-ui test src/App.test.ts`
Expected: FAIL because tabbed layout does not exist yet

**Step 3: Write minimal implementation**

- Update config defaults
- Add aggregation helpers
- Add tabbed App shell test targets

**Step 4: Run tests to verify they pass**

Run the same commands and expect PASS.

### Task 2: Update extension host state and refresh behavior

**Files:**
- Modify: `src/config.ts`
- Modify: `package.json`
- Modify: `src/state/dashboardState.ts`
- Modify: `src/provider/dashboardViewProvider.ts`

**Step 1: Write the failing test**

- Extend state tests to assert logs-derived breakdown and trend aggregation are used

**Step 2: Run test to verify it fails**

Run: `bun run test src/state/dashboardState.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

- Change default `pageSize` to `500`
- Derive chart data from logs instead of info cost buckets
- Keep refresh path loading `info` and first-page logs together
- Keep load-more compatible with larger page size

**Step 4: Run test to verify it passes**

Run: `bun run test src/state/dashboardState.test.ts`
Expected: PASS

### Task 3: Rebuild the Webview around tabs, trend controls, and polling

**Files:**
- Modify: `webview-ui/src/App.vue`
- Modify: `webview-ui/src/App.test.ts`
- Modify: `webview-ui/src/types/dashboard.ts`
- Modify: `webview-ui/src/stores/dashboard.ts`
- Create: `webview-ui/src/composables/useDashboardPreferences.ts`
- Modify: `webview-ui/src/components/Toolbar.vue`
- Modify: `webview-ui/src/components/LogsTable.vue`
- Create: `webview-ui/src/components/TabNav.vue`
- Create: `webview-ui/src/components/TrendControls.vue`
- Modify: `webview-ui/src/styles/app.css`

**Step 1: Write the failing test**

- Assert overview/log tabs render
- Assert logs tab content is isolated
- Assert trend granularity control is present
- Assert polling toggle label is present

**Step 2: Run test to verify it fails**

Run: `bun run --cwd webview-ui test src/App.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

- Add segmented tab nav
- Move logs table to dedicated tab
- Add hourly/daily toggle
- Add polling toggle with 15-second default
- Persist UI preferences through VS Code Webview state

**Step 4: Run test to verify it passes**

Run: `bun run --cwd webview-ui test src/App.test.ts`
Expected: PASS

### Task 4: Improve chart readability and verify packaging

**Files:**
- Modify: `webview-ui/src/charts/costBreakdown.ts`
- Modify: `webview-ui/src/charts/costTrend.ts`
- Modify: `README.md`

**Step 1: Write the failing test**

- Add chart helper assertions for overlap-safe axis label config and model labels

**Step 2: Run test to verify it fails**

Run: `bun run test src/state/dashboardState.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

- Add label truncation and overlap protection
- Use currency-focused trend labels
- Update README if script defaults changed

**Step 4: Run test to verify it passes**

Run: `bun run test src/state/dashboardState.test.ts`
Expected: PASS

### Task 5: Final verification

**Files:**
- Modify: any files touched during fixups

**Step 1: Run root tests**

Run: `bun run test`
Expected: PASS

**Step 2: Run Webview tests**

Run: `bun run test:webview`
Expected: PASS

**Step 3: Run extension tests**

Run: `bun run test:extension`
Expected: PASS

**Step 4: Run package build**

Run: `bun run package:vsix`
Expected: PASS
