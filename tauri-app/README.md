# yls-code

This directory contains the active Tauri desktop application for `yls-code`.

## Stack

- Tauri v2
- Vue 3
- TypeScript
- Bun
- Rust

## Current Scope

- Desktop shell and build wiring
- Rust backend entrypoint
- Vitest setup for the Vue shell

## Commands

- `bun install`
- `bun run test`
- `cargo check --manifest-path src-tauri/Cargo.toml`
- `bun run tauri dev`
- `bun run version:bump` (自动 patch+1，并同步 `package.json` / `Cargo.toml` / `Cargo.lock` / `tauri.conf.json`)

## Auto Update

- 使用 Tauri v2 updater 插件，从 GitHub Release 的 `latest.json` 检查更新。
- 更新公钥通过 `build.rs` 在构建时注入（`TAURI_UPDATER_PUBKEY`），发布构建强制要求该变量。
- 构建机器必须提供：
  - `TAURI_SIGNING_PRIVATE_KEY`
  - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`（可选）
  - `TAURI_UPDATER_PUBKEY`（用于 updater 验签）

## macOS

- 如果用户在 macOS 上看到“`yls-code` 已损坏，无法打开。你应该将它移到废纸篓。”，统一使用下面的终端命令解除隔离属性：
  - `xattr -rd com.apple.quarantine "/Applications/yls-code.app"`

## Release Workflow

- Workflow 文件：`../.github/workflows/release-tauri.yml`
- 触发方式：`push main`（自动）或 `workflow_dispatch`（手动）
- 流程：
  1. 自动 bump 版本并创建 `vX.Y.Z` tag
  2. 顺序构建并发布 Windows x86 (`i686-pc-windows-msvc`) 与 macOS ARM (`aarch64-apple-darwin`) 安装包
  3. 上传 updater 所需签名与 `latest.json` 到同一个 release
  4. GitHub Release 说明中保留 macOS 终端解除隔离属性的处理方式
