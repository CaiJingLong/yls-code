import { defineConfig } from "vitest/config";
import * as path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      vscode: path.resolve(__dirname, "src/test/mocks/vscode.ts")
    }
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["src/test/**"]
  }
});
