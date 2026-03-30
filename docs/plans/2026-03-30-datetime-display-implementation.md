# Datetime Display Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 统一桌面端所有展示型日期时间格式，按当前系统时区显示，并修复概览页 Unix 时间戳裸显示问题。

**Architecture:** 在前端新增一个统一时间格式化模块，识别 epoch 秒/毫秒和 ISO 日期字符串，再由页面和图表复用。保持后端数据存储不变，只修正展示层输出，避免扩大到数据库和 Tauri 命令层。

**Tech Stack:** Vue 3, TypeScript, Vitest, ECharts

---

### Task 1: 为时间格式化工具写失败测试

**Files:**
- Create: `tauri-app/src/lib/datetime.test.ts`
- Create: `tauri-app/src/lib/datetime.ts`

**Step 1: Write the failing test**

- 断言 Unix 秒时间戳可被识别并格式化
- 断言 ISO UTC 字符串可按本地时间格式化
- 断言按天/按小时图表标签输出稳定字符串

**Step 2: Run test to verify it fails**

Run: `bun run test tauri-app/src/lib/datetime.test.ts`

Expected: FAIL，因为工具文件尚未实现

### Task 2: 实现最小时间格式化模块

**Files:**
- Create: `tauri-app/src/lib/datetime.ts`
- Test: `tauri-app/src/lib/datetime.test.ts`

**Step 1: Write minimal implementation**

- 实现统一解析函数
- 实现 `formatDateTimeDisplay`
- 实现 `formatDateDisplay`
- 实现 `formatTrendBucketLabel`

**Step 2: Run focused test**

Run: `bun run test tauri-app/src/lib/datetime.test.ts`

Expected: PASS

### Task 3: 替换页面与图表里的裸时间展示

**Files:**
- Modify: `tauri-app/src/pages/OverviewPage.vue`
- Modify: `tauri-app/src/components/logs/LogsTable.vue`
- Modify: `tauri-app/src/charts/costTrend.ts`

**Step 1: Bind the shared formatter**

- 概览页最近同步时间显示本地格式
- 日志表创建时间显示本地格式
- 趋势图 x 轴和 tooltip 时间显示本地格式

**Step 2: Run app tests**

Run: `bun run test`

Expected: PASS

### Task 4: 完整验证

**Files:**
- Verify only

**Step 1: Run frontend tests**

Run: `bun run test`

Expected: PASS

**Step 2: Run frontend build**

Run: `bun run build`

Expected: PASS
