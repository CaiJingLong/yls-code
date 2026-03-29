# VS Code 用量面板设计

## 背景

当前目录为空，需要从零创建一个 VS Code 扩展。扩展目标是在 VS Code 侧边栏中展示 YLS Codex 用量信息、图表和最近使用记录。

已确认的接口：

- `GET https://code.ylsagi.com/codex/info`
- `GET https://code.ylsagi.com/codex/logs?page=<page>&page_size=<page_size>`

鉴权方式：

- `Authorization: Bearer <apiKey>`

已确认的约束：

- API Key 不硬编码进仓库
- UI 采用侧边栏面板
- 技术栈由实现方选择
- 首版需要支持后续扩展字段和图表
- 主题需要支持跟随系统和手动切换

## 目标

- 在 VS Code 侧边栏提供一个可用的用量仪表盘
- 通过 VS Code 设置读取 API Key 和基础配置
- 展示概览卡片、图表和最近记录列表
- 保持 API Key 不暴露给 Webview 前端
- 为后续新增图表、字段和接口保留扩展位

## 非目标

- 不做复杂筛选器、日期区间查询或导出能力
- 不做登录流程
- 不做多账号切换
- 不做本地持久缓存和离线模式

## 技术选型

- VS Code 扩展宿主：TypeScript
- 侧边栏 UI：Vue 3
- Webview 打包：Vite
- 图表：ECharts
- 测试：
  - 扩展端：Vitest
  - Webview：Vitest + Vue Test Utils
  - 基础扩展验证：`@vscode/test-electron`

选择原因：

- `WebviewView + Vue 3 + Vite + ECharts` 能在首版保持清晰结构，同时支持后续增加图表和状态交互
- 扩展端与 Webview 分层后，API Key 可以只留在扩展宿主侧
- ECharts 对仪表盘类混合图表更合适，扩展图表类型的成本更低

## 总体架构

扩展分为两层：

1. 扩展宿主层
   - 注册侧边栏 `WebviewViewProvider`
   - 读取 VS Code 设置
   - 调用远端接口
   - 管理 Webview 消息通信
   - 负责错误分类和主题配置下发

2. Webview 展示层
   - 渲染工具栏、概览卡片、图表和记录表
   - 接收扩展宿主下发的数据和状态
   - 发出 `refresh`、`loadMore`、`openSettings` 等动作消息
   - 通过适配层将 view model 转成图表配置

关键边界：

- API Key 只存在于扩展宿主层
- Webview 不直接发起鉴权请求
- 图表不直接依赖原始接口字段，而是依赖适配后的 view model

## 页面结构

侧边栏从上到下分为 4 个区域：

1. 工具栏
   - 刷新按钮
   - 打开设置按钮
   - 最近刷新时间
   - 当前主题模式标记

2. 概览卡片区
   - 剩余额度
   - 已用额度
   - 请求次数
   - 套餐类型与到期时间

3. 图表区
   - 成本构成饼图：`input_cost`、`output_cost`、`cache_read_cost`
   - 最近记录趋势图：按最近 N 条记录展示 `total_cost`，辅助展示 `total_tokens`

4. 最近记录区
   - 列表列：`model`、`reasoning`、`total_tokens`、`total_cost`、`createdAt`
   - 加载更多按钮

## 数据流

首次加载：

1. 侧边栏打开
2. 扩展宿主读取配置
3. 若未配置 API Key，下发空态
4. 若已配置 API Key，并行请求 `info` 与 `logs`
5. 将原始响应映射成 view model
6. 下发给 Webview 渲染

交互流程：

- 点击刷新：Webview 发送 `refresh`，扩展宿主重新请求数据
- 点击加载更多：Webview 发送 `loadMore`，扩展宿主拉取下一页日志并合并
- 点击打开设置：Webview 发送 `openSettings`，扩展宿主打开 VS Code 配置页
- 配置变更：扩展宿主监听设置变化并重新同步数据和主题

## 数据模型策略

为保证后续扩展性，数据模型分三层：

1. 原始接口响应
   - 保留接口完整字段，便于后续扩展

2. 归一化领域模型
   - 将 `info`、`logs` 中真正关心的字段提炼成稳定结构

3. 展示模型
   - 概览卡片数据
   - 图表适配数据
   - 表格列数据

实现要求：

- 图表通过 `chart adapters` 从展示模型生成 ECharts option
- 表格通过列配置决定展示哪些字段
- 新增图表时优先增加 adapter，不直接改页面骨架

## 配置项

扩展暴露以下设置：

- `ylsCode.apiKey`
- `ylsCode.baseUrl`，默认 `https://code.ylsagi.com`
- `ylsCode.themeMode`，值为 `system | light | dark`
- `ylsCode.pageSize`，控制首屏与分页条数

API Key 放在 VS Code Settings 中，不写入仓库，也不写入 Webview 本地状态。

## 主题设计

主题支持三种模式：

- `system`：跟随 VS Code 当前主题
- `light`：强制亮色
- `dark`：强制暗色

实现原则：

- Webview 使用一套统一主题状态
- CSS 使用主题变量管理色板
- ECharts 主题由同一状态推导，避免页面和图表各自维护主题判断
- 当 VS Code 主题切换且设置为 `system` 时，Webview 自动刷新样式

## 错误处理

错误分 4 类：

1. 未配置 API Key
   - 显示引导态
   - 提供打开设置按钮

2. 鉴权失败
   - 显示明确文案
   - 不自动重试

3. 网络失败或服务异常
   - 显示错误卡片
   - 允许手动重试

4. 部分数据失败
   - `info` 和 `logs` 独立请求与渲染
   - 某一块失败不阻断另一块成功显示

## 加载体验

- 首次加载显示 skeleton
- 刷新时保留旧数据并显示局部 loading
- 加载更多只锁定记录区
- 错误后保留上一次成功数据

## 测试策略

首版测试覆盖以下行为：

1. 扩展端
   - 配置读取
   - API 请求封装
   - Webview 消息分发
   - 响应映射为 view model

2. Webview
   - 概览卡片数据展示
   - 图表适配器输出
   - 表格列映射
   - 主题切换逻辑

3. 集成
   - 扩展激活后可注册侧边栏视图
   - 使用 mock 数据时面板能渲染基础内容

## 文件布局建议

```text
.
├── src/
│   ├── extension.ts
│   ├── provider/
│   ├── services/
│   ├── state/
│   ├── types/
│   └── test/
├── webview-ui/
│   ├── src/
│   │   ├── components/
│   │   ├── charts/
│   │   ├── styles/
│   │   ├── stores/
│   │   └── types/
│   └── vite.config.ts
└── docs/plans/
```

## 风险与应对

- 接口文档未给出完整 schema
  - 通过真实请求确认已知字段
  - 使用宽松响应类型和映射层隔离变化

- 空仓库从零搭建成本较高
  - 首版只保留必要能力，不引入多余框架

- Webview 样式与 VS Code 主题容易不一致
  - 用统一主题状态驱动 CSS 变量和图表主题

## 实施说明

当前环境不是 git 仓库，因此设计文档无法按流程提交 commit。实现阶段仍按可验证、可测试的方式推进；若后续初始化 git，可再补提交历史。
