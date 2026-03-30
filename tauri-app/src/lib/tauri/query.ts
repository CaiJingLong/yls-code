import { invoke } from "@tauri-apps/api/core";

import type {
  AnalyticsQueryInput,
  AnalyticsResponse,
  LogsQueryInput,
  LogsQueryResponse,
  OverviewResponse,
} from "../../types/query";

export function queryOverview(accountId: string) {
  return invoke<OverviewResponse>("query_overview", { accountId });
}

export function queryLogs(input: LogsQueryInput) {
  return invoke<LogsQueryResponse>("query_logs", { input });
}

export function queryAnalytics(input: AnalyticsQueryInput) {
  return invoke<AnalyticsResponse>("query_analytics", { input });
}
