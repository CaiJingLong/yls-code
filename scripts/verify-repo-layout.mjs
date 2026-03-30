import { existsSync } from "node:fs";

const requiredPaths = [
  "vscode-plugin",
  "tauri-app",
  "README.md",
  "package.json",
];

const forbiddenPaths = [
  "vscode-plugin/dist",
  "vscode-plugin/.vscode-test",
  "vscode-plugin/node_modules",
];

const missing = requiredPaths.filter((path) => !existsSync(path));
const forbidden = forbiddenPaths.filter((path) => existsSync(path));

if (missing.length > 0 || forbidden.length > 0) {
  if (missing.length > 0) {
    console.error(`Missing required paths: ${missing.join(", ")}`);
  }

  if (forbidden.length > 0) {
    console.error(`Forbidden archived paths found: ${forbidden.join(", ")}`);
  }

  process.exit(1);
}

console.log("Repository layout verified.");
