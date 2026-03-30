# SQLite 日志缓存设计

## 目标

- 为 `logs` 增加本地持久缓存
- 通过 `apiKey` 隔离不同账号的数据
- 首次加载不足时自动分页补齐
- 后续刷新优先同步远端前部新页，旧页尽量直接从本地读取

## 选型

- 使用 `sql.js`
- 数据库存放在扩展 `globalStorageUri`
- 单个数据库文件内用 `cache_key` 隔离不同 API Key

选择原因：

- `better-sqlite3` 依赖原生模块，VSIX 分发和跨平台安装更脆弱
- `sql.js` 仍然是 SQLite，支持索引、去重、分页和 SQL 查询
- 通过导出 `.sqlite` 二进制可实现稳定持久化

## 数据模型

### logs

- `cache_key TEXT NOT NULL`
- `log_id TEXT NOT NULL`
- `model TEXT NOT NULL`
- `reasoning TEXT NOT NULL`
- `total_cost REAL NOT NULL`
- `total_tokens INTEGER NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`
- `raw_json TEXT NOT NULL`

主键：

- `(cache_key, log_id)`

索引：

- `(cache_key, created_at DESC)`

### sync_state

- `cache_key TEXT PRIMARY KEY`
- `remote_total INTEGER NOT NULL DEFAULT 0`
- `last_synced_at TEXT`

## 同步策略

### 首次加载或本地不足

- 若本地缓存数量 `< 目标数量`
- 从远端 `page=1` 开始按页请求
- 单页请求大小固定 `200`
- 边拉边 upsert
- 直到本地唯一日志数量达到目标数量，或远端无更多数据

### 后续刷新

- 从远端第 1 页开始同步最新数据
- 若当前页插入了新日志，则继续拉下一页
- 若当前页没有新增日志，则停止
- 同步完成后从本地统一查询最新 N 条返回给 UI

### 加载更多

- 先查本地缓存是否足够支撑目标数量
- 若不足，则从接近本地缓存尾部的远端页开始回填旧数据
- 回填后再从本地统一查询

## 查询策略

- UI 永远只读取“本地归并后的结果”
- 列表和图表都以同一份本地查询结果为准
- 远端只负责同步，不直接作为最终展示数据源

## API Key 隔离

- 不直接存明文 API Key
- 使用 `sha256(apiKey)` 作为 `cache_key`
- 切换 API Key 时自动切换到另一套本地数据

## 风险

- `sql.js` 需要手动导出数据库文件并持久化
- 需要保证每次写入后落盘，避免窗口关闭丢数据
- 旧数据回填的页码只能近似定位，因此需要允许重叠拉取并依赖主键去重
