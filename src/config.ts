import * as vscode from "vscode";

export const EXTENSION_SECTION = "ylsCode";

export type ThemeMode = "system" | "light" | "dark";

export interface ExtensionConfig {
  apiKey: string;
  baseUrl: string;
  themeMode: ThemeMode;
  pageSize: number;
}

export function readExtensionConfig(
  configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(EXTENSION_SECTION)
): ExtensionConfig {
  return {
    apiKey: configuration.get<string>("apiKey", "").trim(),
    baseUrl: configuration.get<string>("baseUrl", "https://code.ylsagi.com").trim().replace(/\/+$/, ""),
    themeMode: configuration.get<ThemeMode>("themeMode", "system"),
    pageSize: configuration.get<number>("pageSize", 10)
  };
}
