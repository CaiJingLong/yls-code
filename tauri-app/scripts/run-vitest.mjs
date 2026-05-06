import { spawnSync } from "node:child_process";
import { cpSync, existsSync, renameSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const nativeRollupDir = resolve(root, "node_modules/rollup");
const wasmRollupDir = resolve(root, "node_modules/@rollup/wasm-node");
const nativeRollupBackupDir = resolve(root, "node_modules/rollup.__native_backup__");

let swapped = false;

try {
  rmSync(nativeRollupBackupDir, { recursive: true, force: true });
  if (existsSync(nativeRollupDir)) {
    renameSync(nativeRollupDir, nativeRollupBackupDir);
    swapped = true;
  }

  cpSync(wasmRollupDir, nativeRollupDir, { recursive: true });

  const result = spawnSync("node", ["./node_modules/vitest/vitest.mjs", "run"], {
    stdio: "inherit",
    env: {
      ...process.env,
    },
  });

  if (result.error) {
    console.error(result.error);
    process.exitCode = 1;
  } else {
    process.exitCode = result.status ?? 1;
  }
} finally {
  if (swapped) {
    rmSync(nativeRollupDir, { recursive: true, force: true });
    renameSync(nativeRollupBackupDir, nativeRollupDir);
  } else {
    rmSync(nativeRollupDir, { recursive: true, force: true });
  }
}
