# VS Code Usage Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a VS Code sidebar extension that reads an API key from settings, fetches usage data from YLS Codex APIs, and renders overview cards, charts, and recent logs with theme support.

**Architecture:** The extension host owns configuration, API requests, and Webview messaging. A Vue 3 Webview renders the dashboard from mapped view models so API response changes do not leak into UI components. Theme state is centralized and drives both CSS variables and ECharts configuration.

**Tech Stack:** TypeScript, VS Code Extension API, Vue 3, Vite, ECharts, Vitest, Vue Test Utils, @vscode/test-electron, bun

---

### Task 1: Scaffold the extension and webview projects

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.webview.json`
- Create: `.gitignore`
- Create: `.vscodeignore`
- Create: `esbuild.mjs`
- Create: `src/extension.ts`
- Create: `src/test/runTest.ts`
- Create: `src/test/suite/index.ts`
- Create: `src/test/suite/extension.test.ts`
- Create: `webview-ui/package.json`
- Create: `webview-ui/tsconfig.json`
- Create: `webview-ui/vite.config.ts`
- Create: `webview-ui/index.html`
- Create: `webview-ui/src/main.ts`
- Create: `webview-ui/src/App.vue`

**Step 1: Write the failing test**

```ts
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  test('registers the sidebar view', async () => {
    const extension = vscode.extensions.getExtension('yls.yls-code');
    await extension?.activate();
    assert.ok(extension?.isActive);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test:extension`
Expected: FAIL because the extension manifest and activation entry do not exist yet.

**Step 3: Write minimal implementation**

- Add the extension manifest, build scripts, and a minimal `activate()` function.
- Register the sidebar view id and the `openSettings` command.
- Add a minimal Vue Webview app entry so the bundle can be produced later.

**Step 4: Run test to verify it passes**

Run: `bun run test:extension`
Expected: PASS for the activation smoke test.

**Step 5: Commit**

```bash
git add package.json tsconfig.json tsconfig.webview.json .gitignore .vscodeignore esbuild.mjs src webview-ui
git commit -m "feat: scaffold vscode usage dashboard extension"
```

If git is not initialized, skip the commit and continue.

### Task 2: Add configuration and API client behavior

**Files:**
- Modify: `package.json`
- Create: `src/config.ts`
- Create: `src/types/api.ts`
- Create: `src/services/apiClient.ts`
- Create: `src/services/apiClient.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { createApiClient } from './apiClient';

describe('createApiClient', () => {
  it('sends bearer token and parses info response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ code: 200, state: { userPackgeUsage: { remaining_quota: 10 } } }),
    });

    const client = createApiClient({
      apiKey: 'test-key',
      baseUrl: 'https://code.ylsagi.com',
      fetchImpl: fetchMock,
    });

    await client.fetchInfo();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://code.ylsagi.com/codex/info',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      }),
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test src/services/apiClient.test.ts`
Expected: FAIL because the client and config modules do not exist yet.

**Step 3: Write minimal implementation**

- Add extension settings schema for:
  - `ylsCode.apiKey`
  - `ylsCode.baseUrl`
  - `ylsCode.themeMode`
  - `ylsCode.pageSize`
- Implement `createApiClient()` with `fetchInfo()` and `fetchLogs()`
- Normalize API error cases for unauthorized, network, and unknown failures

**Step 4: Run test to verify it passes**

Run: `bun run test src/services/apiClient.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json src/config.ts src/types/api.ts src/services/apiClient.ts src/services/apiClient.test.ts
git commit -m "feat: add settings and api client"
```

If git is not initialized, skip the commit and continue.

### Task 3: Build the Webview provider and message bridge

**Files:**
- Modify: `src/extension.ts`
- Create: `src/provider/dashboardViewProvider.ts`
- Create: `src/state/dashboardState.ts`
- Create: `src/provider/dashboardViewProvider.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { createMessageHandler } from './dashboardViewProvider';

describe('dashboard message handler', () => {
  it('calls refresh on refresh message', async () => {
    const refresh = vi.fn();
    const handler = createMessageHandler({ refresh, loadMore: vi.fn(), openSettings: vi.fn() });

    await handler({ type: 'refresh' });

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test src/provider/dashboardViewProvider.test.ts`
Expected: FAIL because the provider and handler do not exist.

**Step 3: Write minimal implementation**

- Add a `DashboardViewProvider` that registers the Webview view
- Generate Webview HTML that points to the Vite-built assets
- Implement message handling for `refresh`, `loadMore`, and `openSettings`
- Add state assembly that can independently update `info` and `logs`

**Step 4: Run test to verify it passes**

Run: `bun run test src/provider/dashboardViewProvider.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/extension.ts src/provider/dashboardViewProvider.ts src/state/dashboardState.ts src/provider/dashboardViewProvider.test.ts
git commit -m "feat: add dashboard webview provider"
```

If git is not initialized, skip the commit and continue.

### Task 4: Render overview cards, charts, and recent logs in Vue

**Files:**
- Create: `webview-ui/src/types/dashboard.ts`
- Create: `webview-ui/src/lib/vscode.ts`
- Create: `webview-ui/src/stores/dashboard.ts`
- Create: `webview-ui/src/charts/costBreakdown.ts`
- Create: `webview-ui/src/charts/costTrend.ts`
- Create: `webview-ui/src/components/Toolbar.vue`
- Create: `webview-ui/src/components/SummaryCards.vue`
- Create: `webview-ui/src/components/ChartPanel.vue`
- Create: `webview-ui/src/components/LogsTable.vue`
- Modify: `webview-ui/src/App.vue`
- Create: `webview-ui/src/App.test.ts`

**Step 1: Write the failing test**

```ts
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import App from './App.vue';

describe('App', () => {
  it('renders remaining quota from dashboard state', () => {
    const wrapper = mount(App, {
      props: {
        initialState: {
          status: 'ready',
          summary: { remainingQuota: 83.891, usedQuota: 36.109, requestCount: 483, packageLabel: 'Pro' },
          charts: { breakdown: [], trend: [] },
          logs: [],
        },
      },
    });

    expect(wrapper.text()).toContain('83.891');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd webview-ui && bun run test src/App.test.ts`
Expected: FAIL because the dashboard app shell and components do not exist.

**Step 3: Write minimal implementation**

- Build the dashboard shell and child components
- Render overview cards, chart containers, and logs table
- Add chart adapter functions that convert dashboard data into ECharts options
- Keep table columns config-driven

**Step 4: Run test to verify it passes**

Run: `cd webview-ui && bun run test src/App.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add webview-ui/src
git commit -m "feat: add dashboard webview ui"
```

If git is not initialized, skip the commit and continue.

### Task 5: Add theme modes, empty states, and pagination behavior

**Files:**
- Modify: `src/config.ts`
- Modify: `src/provider/dashboardViewProvider.ts`
- Create: `webview-ui/src/composables/useTheme.ts`
- Create: `webview-ui/src/styles/theme.css`
- Create: `webview-ui/src/components/EmptyState.vue`
- Create: `webview-ui/src/components/ErrorState.vue`
- Modify: `webview-ui/src/App.vue`
- Create: `webview-ui/src/composables/useTheme.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { resolveThemeMode } from './useTheme';

describe('resolveThemeMode', () => {
  it('uses vscode dark theme when mode is system', () => {
    expect(resolveThemeMode('system', 'vscode-dark')).toBe('dark');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd webview-ui && bun run test src/composables/useTheme.test.ts`
Expected: FAIL because theme resolution logic does not exist yet.

**Step 3: Write minimal implementation**

- Implement `system | light | dark` mode resolution
- Wire theme state from extension host to Webview
- Add empty state for missing API key
- Add error panels for auth and network errors
- Add load-more pagination state for logs

**Step 4: Run test to verify it passes**

Run: `cd webview-ui && bun run test src/composables/useTheme.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/config.ts src/provider/dashboardViewProvider.ts webview-ui/src/composables webview-ui/src/styles webview-ui/src/components webview-ui/src/App.vue
git commit -m "feat: add themes and resilient states"
```

If git is not initialized, skip the commit and continue.

### Task 6: Verify build, add extension packaging support, and document usage

**Files:**
- Modify: `package.json`
- Create: `README.md`
- Create: `CHANGELOG.md`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import manifest from '../package.json';

describe('extension manifest', () => {
  it('declares the sidebar view and configuration keys', () => {
    expect(manifest.contributes.viewsContainers).toBeDefined();
    expect(manifest.contributes.configuration.properties['ylsCode.apiKey']).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test src/manifest.test.ts`
Expected: FAIL until the manifest verification file and final metadata are added.

**Step 3: Write minimal implementation**

- Finalize scripts for build, watch, lint-style checks if needed, and extension tests
- Add README usage instructions for API key and theme mode
- Add changelog entry for the initial version
- Add a manifest test file to lock required contribution points

**Step 4: Run test to verify it passes**

Run: `bun run test src/manifest.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json README.md CHANGELOG.md src/manifest.test.ts
git commit -m "docs: add usage instructions and package metadata"
```

If git is not initialized, skip the commit and continue.

### Task 7: Final verification

**Files:**
- Modify: any files touched during fixes

**Step 1: Run unit tests**

Run: `bun run test`
Expected: PASS

**Step 2: Run webview build**

Run: `bun run build:webview`
Expected: PASS

**Step 3: Run extension build**

Run: `bun run build`
Expected: PASS

**Step 4: Run extension integration test**

Run: `bun run test:extension`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "chore: finalize vscode usage dashboard"
```

If git is not initialized, skip the commit and continue.

## Notes

- The current workspace is not a git repository, so all commit steps are conditional.
- Use the real API response shape already validated during design to seed initial types and mappers.
- Keep `apiKey` on the extension host side only.
