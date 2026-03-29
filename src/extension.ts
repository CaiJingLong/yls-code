import * as vscode from "vscode";
import { DASHBOARD_VIEW_ID, DashboardViewProvider } from "./provider/dashboardViewProvider";

export function activate(context: vscode.ExtensionContext): void {
  const provider = new DashboardViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(DASHBOARD_VIEW_ID, provider),
    vscode.commands.registerCommand("ylsCode.openSettings", () => provider.openSettings()),
    vscode.commands.registerCommand("ylsCode.refresh", () => provider.refresh()),
    vscode.workspace.onDidChangeConfiguration((event) => provider.handleConfigurationChange(event)),
    vscode.window.onDidChangeActiveColorTheme(() => provider.handleThemeChange())
  );
}

export function deactivate(): void {}
