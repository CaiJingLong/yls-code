# 设置页版本显示与完整 i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让设置页始终可见当前版本，并为前端接入完整的 `zh-CN/en-US` 国际化与 Quasar 语言联动。

**Architecture:** 引入 `vue-i18n` 作为统一翻译层，偏好 store 持久化 locale，启动时同步 Quasar 语言包与应用 locale。版本号通过前端版本服务在启动时解析并写入 app 状态，设置页直接消费该状态。

**Tech Stack:** Vue 3、Quasar 2、Vue I18n、Vitest、Tauri v2

---

### Task 1: 建立规格与依赖基线

**Files:**
- Create: `docs/superpowers/specs/2026-05-07-settings-version-and-i18n-design.md`
- Create: `docs/superpowers/plans/2026-05-07-settings-version-and-i18n.md`
- Modify: `tauri-app/package.json`

- [ ] **Step 1: 添加国际化依赖**

```json
{
  "dependencies": {
    "vue-i18n": "^10.x"
  }
}
```

- [ ] **Step 2: 安装依赖并确认 lockfile 更新**

Run: `/Users/cai/.bun/bin/bun install`
Expected: 退出码 0，`tauri-app/bun.lock` 更新

### Task 2: 先补失败测试

**Files:**
- Create: `tauri-app/src/pages/SettingsPage.test.ts`
- Modify: `tauri-app/src/App.test.ts`
- Modify: `tauri-app/src/components/common/DateTimePicker.test.ts`

- [ ] **Step 1: 写设置页失败测试**

```ts
it("shows the current version even when no update is available", async () => {
  // mount page with app version state preset
  // expect current version label/value to exist before any update result
})
```

- [ ] **Step 2: 运行设置页测试确认失败**

Run: `/Users/cai/.bun/bin/bun run test -- SettingsPage.test.ts`
Expected: FAIL，原因是当前页面未固定显示版本

- [ ] **Step 3: 写 locale 切换失败测试**

```ts
it("renders English copy after switching locale", async () => {
  // switch locale
  // expect settings nav or page copy to become English
})
```

- [ ] **Step 4: 运行相关测试确认失败**

Run: `/Users/cai/.bun/bin/bun run test -- App.test.ts DateTimePicker.test.ts`
Expected: FAIL，原因是当前应用没有统一 locale 切换

### Task 3: 实现 i18n 与 Quasar 语言联动

**Files:**
- Create: `tauri-app/src/i18n/enUS.ts`
- Create: `tauri-app/src/i18n/messages.ts`
- Create: `tauri-app/src/i18n/index.ts`
- Modify: `tauri-app/src/i18n/zhCN.ts`
- Modify: `tauri-app/src/main.ts`
- Modify: `tauri-app/src/stores/preferences.ts`
- Modify: `tauri-app/src/components/common/DateTimePicker.vue`
- Modify: `tauri-app/src/pages/SettingsPage.vue`
- Modify: `tauri-app/src/pages/OverviewPage.vue`
- Modify: `tauri-app/src/pages/LogsPage.vue`
- Modify: `tauri-app/src/pages/AnalyticsPage.vue`
- Modify: `tauri-app/src/pages/KeysPage.vue`
- Modify: `tauri-app/src/components/**/*`
- Modify: `tauri-app/src/stores/update.ts`
- Modify: `tauri-app/src/stores/accounts.ts`
- Modify: `tauri-app/src/stores/sync.ts`

- [ ] **Step 1: 建立 i18n 实例与 locale 辅助函数**

```ts
export const i18n = createI18n({
  legacy: false,
  locale: "zh-CN",
  fallbackLocale: "zh-CN",
  messages,
});
```

- [ ] **Step 2: 在偏好 store 中加入 locale 持久化**

```ts
const state = reactive({
  themeMode: stored.themeMode ?? "system",
  locale: stored.locale ?? "zh-CN",
});
```

- [ ] **Step 3: 启动时安装 i18n，并把 Quasar lang 与 locale 绑定**

```ts
createApp(App)
  .use(i18n)
  .use(Quasar, { lang: quasarLangPacks["zh-CN"] })
```

- [ ] **Step 4: 将组件和页面改为 `useI18n()`**

```ts
const { t } = useI18n();
```

- [ ] **Step 5: 更新 store / 非组件场景的文案读取**

```ts
state.message = t("settings.updateChecking");
```

### Task 4: 实现版本号服务与设置页展示

**Files:**
- Create: `tauri-app/src/lib/version.ts`
- Modify: `tauri-app/src/stores/app.ts`
- Modify: `tauri-app/src/pages/SettingsPage.vue`

- [ ] **Step 1: 添加版本读取服务**

```ts
export async function resolveAppVersion() {
  return isTauriRuntime() ? getVersion() : packageJson.version;
}
```

- [ ] **Step 2: 启动时初始化版本**

```ts
const state = reactive({
  initialized: false,
  version: "",
});
```

- [ ] **Step 3: 在设置页固定显示当前版本**

```vue
<div class="field">
  <span>{{ t("settings.currentVersion") }}</span>
  <code>{{ appStore.state.version }}</code>
</div>
```

### Task 5: 回归验证

**Files:**
- Test: `tauri-app/src/pages/SettingsPage.test.ts`
- Test: `tauri-app/src/App.test.ts`
- Test: `tauri-app/src/components/common/DateTimePicker.test.ts`
- Test: `tauri-app/src/pages/AnalyticsPage.test.ts`
- Test: `tauri-app/src/pages/LogsPage.test.ts`

- [ ] **Step 1: 运行前端测试**

Run: `/Users/cai/.bun/bin/bun run test`
Expected: PASS

- [ ] **Step 2: 运行类型检查**

Run: `/Users/cai/.bun/bin/bun run typecheck`
Expected: PASS
