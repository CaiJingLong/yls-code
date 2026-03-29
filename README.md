# YLS Code

一个简单的 VS Code 侧边栏插件，用来展示 YLS Codex 的用量概览、图表和最近请求记录。

## 功能

- 在 Activity Bar 中提供 `YLS Code` 侧边栏入口
- 读取 `ylsCode.apiKey` 配置后请求：
  - `GET /codex/info`
  - `GET /codex/logs`
- 展示概览卡片、成本构成图、最近记录趋势图和记录列表
- 支持 `system | light | dark` 主题模式

## 环境要求

- Bun 1.3+
- VS Code 1.96+

## 安装依赖

根项目和 Webview 子项目各自维护依赖，需要分别安装：

```bash
bun install
bun install --cwd webview-ui
```

## 常用脚本

在仓库根目录执行：

- `bun run build`
  - 先构建 Webview，再构建扩展入口
- `bun run build:webview`
  - 只构建 Vue + ECharts Webview
- `bun run build:extension`
  - 只构建扩展宿主代码到 `dist/extension.js`
- `bun run dev:webview`
  - 启动 Webview 的 Vite 开发服务
- `bun run watch:webview`
  - 监听模式构建 Webview 产物
- `bun run watch:extension`
  - 监听模式构建扩展宿主代码
- `bun run test`
  - 运行根项目单测
- `bun run test:webview`
  - 运行 Webview 单测
- `bun run test:extension`
  - 运行 VS Code 扩展集成测试
- `bun run package:vsix`
  - 生成可安装的 `.vsix`

## 在 VS Code 中运行

### 方式一：开发模式运行

1. 在当前仓库执行依赖安装
2. 执行一次构建：

```bash
bun run build
```

3. 用 VS Code 打开仓库
4. 按 `F5` 启动 `Extension Development Host`
5. 在新打开的开发宿主窗口中进入 Settings，设置以下项：
   - `ylsCode.apiKey`
   - `ylsCode.baseUrl`，默认是 `https://code.ylsagi.com`
   - `ylsCode.themeMode`
   - `ylsCode.pageSize`
6. 在左侧 Activity Bar 中点击 `YLS Code`

### 方式二：打包后安装

先在根目录执行：

```bash
bun run package:vsix
```

然后在 VS Code 中执行：

1. `Extensions: Install from VSIX...`
2. 选择生成的 `.vsix`
3. 安装后重载窗口

## 配置项

- `ylsCode.apiKey`
  - 必填，YLS Codex API Key
- `ylsCode.baseUrl`
  - 默认 `https://code.ylsagi.com`
- `ylsCode.themeMode`
  - 可选 `system`、`light`、`dark`
- `ylsCode.pageSize`
  - 最近记录分页条数

## 项目结构

```text
.
├── src/                 # 扩展宿主代码
├── webview-ui/          # Vue + ECharts Webview
├── dist/                # 扩展构建产物
├── resources/           # 图标等资源
└── docs/plans/          # 设计和实现计划
```

## 接口说明

- `GET https://code.ylsagi.com/codex/info`
- `GET https://code.ylsagi.com/codex/logs?page=<page>&page_size=<page_size>`

鉴权方式：

```http
Authorization: Bearer <apiKey>
```
