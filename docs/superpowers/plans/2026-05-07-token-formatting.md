# Token Formatting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared compact-number formatter for token counts and use it everywhere the frontend explicitly displays tokens.

**Architecture:** Keep number formatting in a single utility under `tauri-app/src/lib`, then consume it from token-related views/components only. Validate behavior with a formatter unit test first, then verify rendered output in the affected UI tests.

**Tech Stack:** Vue 3, TypeScript, Vitest, Vue Test Utils

---

### Task 1: Add formatter test coverage

**Files:**
- Create: `tauri-app/src/lib/number.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import { formatCompactNumber } from "./number";

describe("formatCompactNumber", () => {
  it("formats integers with compact units for large values", () => {
    expect(formatCompactNumber(950)).toBe("950");
    expect(formatCompactNumber(1000)).toBe("1k");
    expect(formatCompactNumber(1200)).toBe("1.2k");
    expect(formatCompactNumber(3456000)).toBe("3.5m");
    expect(formatCompactNumber(7800000000)).toBe("7.8b");
    expect(formatCompactNumber(1200000000000)).toBe("1.2t");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk /Users/cai/.bun/bin/bun test src/lib/number.test.ts`
Expected: FAIL because `./number` or `formatCompactNumber` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `tauri-app/src/lib/number.ts` with a compact formatter that returns plain integers below 1000 and uses `k/m/b/t` above that threshold.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk /Users/cai/.bun/bin/bun test src/lib/number.test.ts`
Expected: PASS

### Task 2: Verify UI token rendering uses the formatter

**Files:**
- Create: `tauri-app/src/pages/OverviewPage.test.ts`
- Modify: `tauri-app/src/components/logs/LogsTable.test.ts`
- Modify: `tauri-app/src/pages/AnalyticsPage.test.ts`

- [ ] **Step 1: Write failing UI tests**

Add assertions covering:

- Overview page total tokens render as `1.2k`
- Analytics filtered tokens and ranking tokens render as compact values
- Logs table token column renders compact values

- [ ] **Step 2: Run tests to verify they fail**

Run: `rtk /Users/cai/.bun/bin/bun test src/pages/OverviewPage.test.ts src/pages/AnalyticsPage.test.ts src/components/logs/LogsTable.test.ts`
Expected: FAIL because current UI still renders raw token counts.

- [ ] **Step 3: Write minimal implementation**

Import the shared formatter into:

- `tauri-app/src/pages/OverviewPage.vue`
- `tauri-app/src/pages/AnalyticsPage.vue`
- `tauri-app/src/components/logs/LogsTable.vue`

and apply it only to token display fields.

- [ ] **Step 4: Run tests to verify they pass**

Run: `rtk /Users/cai/.bun/bin/bun test src/pages/OverviewPage.test.ts src/pages/AnalyticsPage.test.ts src/components/logs/LogsTable.test.ts`
Expected: PASS

### Task 3: Final verification

**Files:**
- Modify: `tauri-app/src/lib/number.ts`
- Modify: `tauri-app/src/pages/OverviewPage.vue`
- Modify: `tauri-app/src/pages/AnalyticsPage.vue`
- Modify: `tauri-app/src/components/logs/LogsTable.vue`
- Modify: `tauri-app/src/lib/number.test.ts`
- Modify: `tauri-app/src/pages/OverviewPage.test.ts`
- Modify: `tauri-app/src/pages/AnalyticsPage.test.ts`
- Modify: `tauri-app/src/components/logs/LogsTable.test.ts`

- [ ] **Step 1: Run focused test suite**

Run: `rtk /Users/cai/.bun/bin/bun test src/lib/number.test.ts src/pages/OverviewPage.test.ts src/pages/AnalyticsPage.test.ts src/components/logs/LogsTable.test.ts`
Expected: PASS

- [ ] **Step 2: Run typecheck**

Run: `rtk /Users/cai/.bun/bin/bun run typecheck`
Expected: PASS
