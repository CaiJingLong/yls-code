# YLS Desktop Workbench

This repository now hosts the desktop version of the YLS usage workbench.

## Repository Layout

- `tauri-app/`
  - Active Tauri desktop application
- `vscode-plugin/`
  - Archived VS Code plugin source and related design docs
- `docs/plans/`
  - Active design and implementation plans for the desktop app

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

- `bun run verify:repo-layout`
  - Verify the archive and app directories are present and generated output is kept out of the archive tree
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
- Desktop app bundle output: `tauri-app/src-tauri/target/release/bundle/macos/`

## Notes

- The archived plugin source remains available under `vscode-plugin/`
- Current desktop build scripts assume the local Rust toolchain pinned in `tauri-app/rust-toolchain.toml`
