import * as assert from "node:assert";
import * as vscode from "vscode";

suite("Extension Test Suite", () => {
  test("registers the sidebar view", async () => {
    const extension = vscode.extensions.getExtension("yls.yls-code");

    await extension?.activate();

    assert.ok(extension?.isActive);
  });
});
