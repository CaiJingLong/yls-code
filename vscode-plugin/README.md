# YLS Code

一个简单的 VS Code 侧边栏插件，用来展示 YLS Codex 的用量概览、图表和最近请求记录。

## 功能

- 在 Activity Bar 中提供 `YLS Code` 侧边栏入口
- 读取 `ylsCode.apiKey` 配置后请求：
  - `GET /codex/info`
  - `GET /codex/logs`
- 通过 `概览 / 最近记录` 双 Tab 展示数据
- 展示概览卡片、按模型聚合的成本构成图、按小时/按天切换的美元趋势图
- 最近记录首屏默认拉取 500 条，并支持继续加载更多
- 支持 15 秒自动轮询刷新用量和日志
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
  - 生成可安装的 `yls-code.vsix`
- `bun run install:vsix`
  - 先打包 `yls-code.vsix`，再通过 `code --install-extension` 直接安装到本机 VS Code

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
2. 选择生成的 `yls-code.vsix`
3. 安装后重载窗口

### 方式三：命令行直接安装

如果本机已经可用 `code` 命令，可以直接在仓库根目录执行：

```bash
bun run install:vsix
```

这个命令会：

1. 构建扩展
2. 生成 `yls-code.vsix`
3. 调用 `code --install-extension ./yls-code.vsix --force` 安装到当前 VS Code

## 配置项

- `ylsCode.apiKey`
  - 必填，YLS Codex API Key
- `ylsCode.baseUrl`
  - 默认 `https://code.ylsagi.com`
- `ylsCode.themeMode`
  - 可选 `system`、`light`、`dark`
- `ylsCode.pageSize`
  - 最近记录分页条数，默认 `500`

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
