import * as vscode from "vscode";
import type { ThemeMode } from "../config";
import type { CodexInfoResponse, CodexLogsBatchResponse, CodexLogsResponse } from "../types/api";
import { ApiClientError } from "../services/apiClient";

export type ResolvedTheme = "light" | "dark";

export interface DashboardErrorState {
  code: "MISSING_API_KEY" | "UNAUTHORIZED" | "NETWORK" | "UNKNOWN";
  section: "info" | "logs" | "global";
  message: string;
}

export interface DashboardSummary {
  remainingQuota: number;
  usedQuota: number;
  totalQuota: number;
  requestCount: number;
  packageLabel: string;
  expiresAt: string | null;
}

export interface DashboardChartDatum {
  label: string;
  value: number;
}

export interface DashboardTrendDatum {
  label: string;
  value: number;
  secondaryValue: number;
}

export interface DashboardLogRow {
  id: string;
  model: string;
  reasoning: string;
  totalTokens: number;
  totalCost: number;
  createdAt: string;
}

export interface DashboardPagination {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  nextPage: number | null;
}

export interface DashboardViewState {
  status: "empty" | "loading" | "ready" | "error";
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  lastUpdatedAt: string | null;
  summary: DashboardSummary | null;
  charts: {
    breakdown: DashboardChartDatum[];
    trend: DashboardTrendDatum[];
  };
  logs: DashboardLogRow[];
  pagination: DashboardPagination;
  errors: DashboardErrorState[];
}

export function resolveThemeMode(mode: ThemeMode, kind: vscode.ColorThemeKind): ResolvedTheme {
  if (mode === "light" || mode === "dark") {
    return mode;
  }

  return kind === vscode.ColorThemeKind.Light || kind === vscode.ColorThemeKind.HighContrastLight ? "light" : "dark";
}

export function createEmptyState(themeMode: ThemeMode, resolvedTheme: ResolvedTheme, pageSize: number): DashboardViewState {
  return {
    status: "empty",
    themeMode,
    resolvedTheme,
    lastUpdatedAt: null,
    summary: null,
    charts: {
      breakdown: [],
      trend: []
    },
    logs: [],
    pagination: {
      page: 1,
      pageSize,
      total: 0,
      hasMore: false,
      isLoadingMore: false,
      nextPage: 1
    },
    errors: [
      {
        code: "MISSING_API_KEY",
        section: "global",
        message: "请先在 VS Code 设置中填写 ylsCode.apiKey。"
      }
    ]
  };
}

export function createLoadingState(themeMode: ThemeMode, resolvedTheme: ResolvedTheme, pageSize: number): DashboardViewState {
  return {
    ...createEmptyState(themeMode, resolvedTheme, pageSize),
    status: "loading",
    errors: []
  };
}

export function mapInfoSummary(response: CodexInfoResponse): DashboardSummary {
  const currentPackage = response.state.package.packages[0];

  return {
    remainingQuota: response.state.userPackgeUsage.remaining_quota,
    usedQuota: response.state.userPackgeUsage.total_cost,
    totalQuota: response.state.userPackgeUsage.total_quota,
    requestCount: response.state.userPackgeUsage.request_count,
    packageLabel: currentPackage?.package_type ?? "Unknown",
    expiresAt: currentPackage?.expires_at ?? null
  };
}

export function mapBreakdownChart(response: CodexInfoResponse): DashboardChartDatum[] {
  const usage = response.state.userPackgeUsage;

  return [
    { label: "Input", value: usage.input_cost },
    { label: "Output", value: usage.output_cost },
    { label: "Cache", value: usage.cache_read_cost }
  ];
}

export function mapTrendChart(response: CodexLogsResponse): DashboardTrendDatum[] {
  return response.data.items
    .slice()
    .reverse()
    .map((item) => ({
      label: new Date(item.createdAt).toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }),
      value: item.total_cost,
      secondaryValue: item.total_tokens
    }));
}

export function mapTrendFromLogs(logs: DashboardLogRow[]): DashboardTrendDatum[] {
  return logs
    .slice()
    .reverse()
    .map((item) => ({
      label: new Date(item.createdAt).toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }),
      value: item.totalCost,
      secondaryValue: item.totalTokens
    }));
}

export function mapLogs(response: CodexLogsResponse | CodexLogsBatchResponse): DashboardLogRow[] {
  return response.data.items.map((item) => ({
    id: item._id,
    model: item.model,
    reasoning: item.reasoning,
    totalTokens: item.total_tokens,
    totalCost: item.total_cost,
    createdAt: item.createdAt
  }));
}

export function mapPagination(response: CodexLogsBatchResponse, isLoadingMore = false): DashboardPagination {
  const { page, page_size, total, fetched_pages, next_page } = response.data;

  return {
    page: page + fetched_pages - 1,
    pageSize: page_size,
    total,
    hasMore: next_page !== null,
    isLoadingMore,
    nextPage: next_page
  };
}

export function mapError(error: unknown, section: DashboardErrorState["section"]): DashboardErrorState {
  if (error instanceof ApiClientError) {
    return {
      code: error.code,
      section,
      message:
        error.code === "UNAUTHORIZED"
          ? "API Key 无效或已过期。"
          : error.code === "NETWORK"
            ? "网络请求失败，请稍后重试。"
            : "接口返回异常，请稍后重试。"
    };
  }

  return {
    code: "UNKNOWN",
    section,
    message: "发生未知错误。"
  };
}
