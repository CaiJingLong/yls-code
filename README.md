# YLS Desktop Workbench

This repository now hosts the desktop version of the YLS usage workbench.

## Repository Layout

- `tauri-app/`
  - Active Tauri desktop application
- `vscode-plugin/`
  - Archived VS Code plugin source and related design docs
- `docs/plans/`
  - Active design and implementation plans for the desktop app

## Current Status

- The old VS Code plugin has been archived for reference.
- The active product is being rebuilt as a local Tauri app.
- Repository-level scripts are exposed from the root package and delegate into `tauri-app/`.

## Root Scripts

- `bun run verify:repo-layout`
  - Verify the archive and app directories are present and generated output is kept out of the archive tree
- `bun run dev`
  - Start the desktop app in development mode once `tauri-app/` is scaffolded
- `bun run build`
  - Build the desktop app once `tauri-app/` is scaffolded
- `bun run test`
  - Run app tests once `tauri-app/` is scaffolded
