# Token Formatting Design

## Goal

将前端里显式展示 token 数量的位置统一改为紧凑单位格式，避免页面各自实现格式化逻辑。

## Scope

- 仅处理前端展示层中的 token 数量。
- 本次不修改金额、请求数、日志数等其他数值显示规则。

## Design

### Formatting rule

- `< 1000` 显示原整数。
- `>= 1000` 使用紧凑单位：`k`、`m`、`b`、`t`。
- 默认保留 1 位小数。
- 若小数部分为 `0`，则去掉小数位。

示例：

- `950 -> 950`
- `1000 -> 1k`
- `1200 -> 1.2k`
- `3456000 -> 3.5m`

### Implementation boundary

- 新增一个前端公共工具函数，放在 `tauri-app/src/lib` 下。
- 所有 token 展示统一通过该工具函数格式化。
- 仅接入当前明确展示 token 的位置：
  - `tauri-app/src/pages/OverviewPage.vue`
  - `tauri-app/src/pages/AnalyticsPage.vue`
  - `tauri-app/src/components/logs/LogsTable.vue`

### Testing

- 为公共工具新增单元测试，覆盖原值、`k/m/b/t`、去尾零等行为。
- 为现有页面/组件补充或更新渲染测试，确认 token 展示走新格式。
