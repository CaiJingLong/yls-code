# Overview Remaining Quota Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在概览页展示来自 YLS `/codex/info` 的真实今日剩余额度，并在轮询触发同步后刷新该额度。

**Architecture:** 保留本地 SQLite 聚合概览接口 `query_overview`，在该查询中补充一次远端 `/codex/info` 拉取，把 `remaining_quota` 合并到 `OverviewResponse`。前端继续只请求一个概览接口，借助现有 `syncStore` 状态变化触发 `OverviewPage` 重新加载，从而在自动轮询后同步刷新额度。

**Tech Stack:** Rust, Tauri command, reqwest, rusqlite, Vue 3, TypeScript, Vitest

---

### Task 1: 为概览额度补后端失败测试

**Files:**
- Modify: `tauri-app/src-tauri/tests/query_overview.rs`
- Check: `tauri-app/src-tauri/src/services/query_service.rs`
- Check: `tauri-app/src-tauri/src/services/yls_client.rs`

**Step 1: Write the failing test**

- 在 `query_overview.rs` 中引入 `mockito`
- 把测试账号 `base_url` 指向 mock server
- 断言 `QueryService::query_overview()` 返回远端 `remaining_quota`

**Step 2: Run test to verify it fails**

Run: `cargo test query_overview_returns_remote_remaining_quota --manifest-path tauri-app/src-tauri/Cargo.toml`

Expected: FAIL，因为 `OverviewResponse` 尚未包含额度字段，且 `query_overview` 尚未请求 `/codex/info`

### Task 2: 以最小改动实现远端额度合并

**Files:**
- Modify: `tauri-app/src-tauri/src/services/query_service.rs`
- Modify: `tauri-app/src-tauri/src/commands/query.rs`
- Modify: `tauri-app/src/types/query.ts`
- Modify: `tauri-app/src/lib/tauri/query.ts`

**Step 1: Write minimal implementation**

- 在 Rust `OverviewResponse` 中新增 `today_remaining_quota`
- `query_overview` 从账号 `base_url` 和 secret store 读取 API Key
- 使用现有 `YlsClient::fetch_info()` 获取 `state.userPackgeUsage.remaining_quota`
- 将额度并入响应

**Step 2: Run focused tests**

Run: `cargo test query_overview_returns_remote_remaining_quota --manifest-path tauri-app/src-tauri/Cargo.toml`

Expected: PASS

### Task 3: 更新前端概览展示

**Files:**
- Modify: `tauri-app/src/pages/OverviewPage.vue`
- Modify: `tauri-app/src/i18n/zhCN.ts`
- Test: `tauri-app/src/App.test.ts`

**Step 1: Bind the new field**

- 将概览第二张卡绑定到真实额度字段
- 文案保持“今日剩余可用额度”
- 保证轮询同步完成后，`OverviewPage` 的既有 watch 能重新触发 `loadData()`

**Step 2: Run frontend verification**

Run: `bun run test --cwd tauri-app`

Expected: PASS

### Task 4: 完整验证

**Files:**
- Verify only

**Step 1: Run Rust tests**

Run: `cargo test --manifest-path tauri-app/src-tauri/Cargo.toml`

Expected: PASS

**Step 2: Run web tests and build**

Run: `bun run test --cwd tauri-app`
Run: `bun run build --cwd tauri-app`

Expected: PASS
