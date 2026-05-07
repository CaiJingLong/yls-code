# 设置页版本显示与完整 i18n 设计

## 背景

当前桌面前端直接在各页面、组件和 store 中引用 `zhCN` 常量，缺少统一的国际化入口，也没有把 Quasar 自带控件语言与应用语言绑定。设置页的“应用更新”区块只有在发现新版本后才会显示版本信息，无法直观看到当前版本。

## 目标

1. 设置页固定展示应用当前版本，即使没有可用更新也能看到。
2. 为项目补齐统一 i18n 机制，至少支持 `zh-CN` 和 `en-US`。
3. Quasar 组件语言包与应用 locale 联动，覆盖 `QDate`、`QTime` 等内置文案与日期本地化。
4. 语言选择进入用户偏好并持久化。

## 非目标

1. 不新增更多语言。
2. 不重做页面布局。
3. 不扩展 Rust 侧系统命令来返回版本号，优先复用前端可用 API。

## 方案

### 版本号显示

- 新增前端版本服务，优先调用 `@tauri-apps/api/app` 的 `getVersion()`。
- 在非 Tauri 或测试环境回退到前端 `package.json` 里的版本号。
- 应用启动时初始化当前版本并写入一个轻量 app 状态。
- 设置页“应用更新”区块始终显示当前版本；若发现新版本，再额外显示“可用版本”和更新说明。

### 国际化架构

- 引入 `vue-i18n`，使用 `createI18n({ legacy: false })` 建立全局实例。
- 将现有 `zhCN` 文案拆成消息对象，并补一份 `enUS` 对应翻译。
- 组件统一改为 `useI18n()` 读取 `t()`；非组件环境通过共享 i18n 实例或包装函数取文案。
- 对于需要插值的文案，统一改为 `t('key', params)`，不再手写 `.replace(...)`。

### Quasar 语言联动

- `main.ts` 安装 Quasar 时提供默认 `zh-CN` 语言包。
- 新增 locale 服务，负责把应用 locale 映射到 Quasar 语言包，并在切换时调用 `$q.lang.set(...)`。
- 设置页增加语言选择项，切换后页面文案和 Quasar 组件应同步刷新。

### 偏好持久化

- 在现有 `preferencesStore` 中加入 `locale` 字段。
- 首次进入默认 `zh-CN`，后续从 `localStorage` 恢复。

## 影响范围

- `tauri-app/src/main.ts`
- `tauri-app/src/i18n/*`
- `tauri-app/src/stores/preferences.ts`
- `tauri-app/src/stores/app.ts`
- `tauri-app/src/stores/update.ts`
- `tauri-app/src/pages/*`
- `tauri-app/src/components/**/*`
- 相关测试文件

## 错误处理

- 版本读取失败时回退到构建版本号，不阻断应用启动。
- 未知 locale 回退到 `zh-CN`。
- Quasar 语言包加载失败时保持当前语言，不中断界面交互。

## 测试策略

1. 新增设置页测试，验证未发现更新时也会显示当前版本。
2. 新增 i18n/locale 测试，验证切换 locale 会影响页面文案和 Quasar 输入占位符。
3. 回归现有页面测试，确认原有筛选、表格和图表行为不变。
