# yls-code Release Checklist

- Run `bun run verify:repo-layout`
- Run `bun run test`
- Run `bun run build:web`
- Run `bun run build`
- Confirm the desktop bundle exists under `tauri-app/src-tauri/target/release/bundle/macos/yls-code.app`
- Confirm the archived plugin source remains under `vscode-plugin/`
