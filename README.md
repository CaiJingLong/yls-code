# yls-code

This repository now hosts the desktop version of `yls-code`.

## Repository Layout

- `tauri-app/`
  - Active Tauri desktop application

## Local Setup

1. Install root tooling:

```bash
bun install
```

2. Install the app dependencies:

```bash
bun install --cwd tauri-app
```

3. Start the desktop app:

```bash
bun run dev
```

This opens the active Tauri app from `tauri-app/`.

## Root Scripts

- `bun run dev`
  - Start the Tauri desktop app in development mode
- `bun run test`
  - Run the Vue test suite and all Rust integration tests
- `bun run test:web`
  - Run the Vue test suite only
- `bun run test:rust`
  - Run the Rust test suite only
- `bun run build:web`
  - Build the Vue frontend only
- `bun run build`
  - Build the packaged desktop application through Tauri

## Output

- Frontend build output: `tauri-app/dist/`
- Desktop app bundle output: `tauri-app/src-tauri/target/release/bundle/macos/yls-code.app`

## macOS Troubleshooting

如果在 macOS 上首次打开应用时看到“`yls-code` 已损坏，无法打开。你应该将它移到废纸篓。”，执行下面的终端命令解除隔离属性：

```bash
xattr -rd com.apple.quarantine "/Applications/yls-code.app"
```

注意：

- 只应在你确认安装包来自本仓库 GitHub Release 时执行上述操作。

## Notes

- Current desktop build scripts assume the local Rust toolchain pinned in `tauri-app/rust-toolchain.toml`
