import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import { readExtensionConfig } from "../config";
import { createApiClient } from "../services/apiClient";
import {
  createEmptyState,
  createLoadingState,
  mapError,
  mapInfoSummary,
  mapLogs,
  mapPagination,
  resolveThemeMode,
  type DashboardViewState
} from "../state/dashboardState";

export const DASHBOARD_VIEW_ID = "ylsCode.dashboardView";

export type DashboardMessage =
  | { type: "ready" }
  | { type: "refresh" }
  | { type: "loadMore" }
  | { type: "openSettings" };

export interface MessageActions {
  ready(): Promise<void> | void;
  refresh(): Promise<void> | void;
  loadMore(): Promise<void> | void;
  openSettings(): Promise<void> | void;
}

export function createMessageHandler(actions: MessageActions) {
  return async (message: DashboardMessage): Promise<void> => {
    switch (message.type) {
      case "ready":
        await actions.ready();
        break;
      case "refresh":
        await actions.refresh();
        break;
      case "loadMore":
        await actions.loadMore();
        break;
      case "openSettings":
        await actions.openSettings();
        break;
      default:
        break;
    }
  };
}

export class DashboardViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private state?: DashboardViewState;

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, "webview-ui", "dist"),
        vscode.Uri.joinPath(this.extensionUri, "resources")
      ]
    };
    webviewView.webview.html = this.getWebviewHtml(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(
      createMessageHandler({
        ready: () => this.handleReady(),
        refresh: () => this.refresh(),
        loadMore: () => this.loadMore(),
        openSettings: () => this.openSettings()
      })
    );
  }

  private async handleReady(): Promise<void> {
    if (!this.state || this.state.status === "loading") {
      await this.refresh();
      return;
    }

    await this.postState();
  }

  async refresh(): Promise<void> {
    if (!this.view) {
      return;
    }

    const config = readExtensionConfig();
    const resolvedTheme = resolveThemeMode(config.themeMode, vscode.window.activeColorTheme.kind);

    if (!config.apiKey) {
      this.state = createEmptyState(config.themeMode, resolvedTheme, config.pageSize);
      await this.postState();
      return;
    }

    this.state = this.state
      ? {
          ...this.state,
          status: "loading",
          themeMode: config.themeMode,
          resolvedTheme,
          errors: []
        }
      : createLoadingState(config.themeMode, resolvedTheme, config.pageSize);
    await this.postState();

    const client = createApiClient(config);
    const [infoResult, logsResult] = await Promise.allSettled([
      client.fetchInfo(),
      client.fetchLogs(1, config.pageSize)
    ]);

    const nextState = createLoadingState(config.themeMode, resolvedTheme, config.pageSize);
    nextState.status = "ready";
    nextState.lastUpdatedAt = new Date().toISOString();

    if (infoResult.status === "fulfilled") {
      nextState.summary = mapInfoSummary(infoResult.value);
    } else {
      nextState.errors.push(mapError(infoResult.reason, "info"));
    }

    if (logsResult.status === "fulfilled") {
      nextState.logs = mapLogs(logsResult.value);
      nextState.pagination = mapPagination(logsResult.value);
    } else {
      nextState.errors.push(mapError(logsResult.reason, "logs"));
    }

    if (nextState.errors.length > 0 && !nextState.summary && nextState.logs.length === 0) {
      nextState.status = "error";
    }

    this.state = nextState;
    await this.postState();
  }

  async loadMore(): Promise<void> {
    if (
      !this.view ||
      !this.state ||
      this.state.pagination.isLoadingMore ||
      !this.state.pagination.hasMore ||
      this.state.pagination.nextPage === null
    ) {
      return;
    }

    const config = readExtensionConfig();
    if (!config.apiKey) {
      return;
    }

    this.state = {
      ...this.state,
      pagination: {
        ...this.state.pagination,
        isLoadingMore: true
      }
    };
    await this.postState();

    try {
      const client = createApiClient(config);
      const nextPage = this.state.pagination.nextPage;
      const response = await client.fetchLogs(nextPage, this.state.pagination.pageSize);
      const mergedLogs = dedupeLogsById([...this.state.logs, ...mapLogs(response)]);

      this.state = {
        ...this.state,
        logs: mergedLogs,
        pagination: mapPagination(response)
      };
    } catch (error) {
      this.state = {
        ...this.state,
        errors: [...this.state.errors.filter((item) => item.section !== "logs"), mapError(error, "logs")],
        pagination: {
          ...this.state.pagination,
          isLoadingMore: false
        }
      };
      await this.postState();
      return;
    }

    this.state.pagination = {
      ...this.state.pagination,
      isLoadingMore: false
    };
    await this.postState();
  }

  async openSettings(): Promise<void> {
    await vscode.commands.executeCommand("workbench.action.openSettings", "ylsCode");
  }

  handleConfigurationChange(event: vscode.ConfigurationChangeEvent): void {
    if (event.affectsConfiguration("ylsCode")) {
      void this.refresh();
    }
  }

  handleThemeChange(): void {
    if (!this.state) {
      return;
    }

    const config = readExtensionConfig();
    this.state = {
      ...this.state,
      themeMode: config.themeMode,
      resolvedTheme: resolveThemeMode(config.themeMode, vscode.window.activeColorTheme.kind)
    };
    void this.postState();
  }

  private async postState(): Promise<void> {
    if (!this.view || !this.state) {
      return;
    }

    await this.view.webview.postMessage({
      type: "state",
      payload: this.state
    });
  }

  private getWebviewHtml(webview: vscode.Webview): string {
    const builtDir = path.join(this.extensionUri.fsPath, "webview-ui", "dist");
    const builtIndex = path.join(builtDir, "index.html");

    if (fs.existsSync(builtIndex)) {
      const rawHtml = fs.readFileSync(builtIndex, "utf8");
      return rawHtml.replace(/(src|href)="([^"]+)"/g, (_match, attribute, resourcePath) => {
        if (/^(https?:|data:|vscode-webview-resource:)/.test(resourcePath)) {
          return `${attribute}="${resourcePath}"`;
        }

        const normalizedPath = resourcePath.replace(/^\.\//, "");
        const uri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "webview-ui", "dist", normalizedPath));
        return `${attribute}="${uri.toString()}"`;
      });
    }

    return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>YLS Code</title>
    <style>
      body {
        font-family: var(--vscode-font-family);
        color: var(--vscode-foreground);
        background: var(--vscode-sideBar-background);
        padding: 16px;
      }

      .card {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 12px;
        padding: 16px;
        background: color-mix(in srgb, var(--vscode-sideBar-background) 88%, white 12%);
      }
    </style>
  </head>
  <body>
    <div class="card">
      <strong>YLS Code</strong>
      <p>正在等待 Webview 构建产物。</p>
    </div>
  </body>
</html>`;
  }
}

function dedupeLogsById(logs: ReturnType<typeof mapLogs>): ReturnType<typeof mapLogs> {
  const seen = new Set<string>();

  return logs.filter((log) => {
    if (seen.has(log.id)) {
      return false;
    }

    seen.add(log.id);
    return true;
  });
}
