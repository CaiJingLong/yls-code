export interface OverviewResponse {
  accountId: string;
  accountName: string;
  baseUrl: string;
  enabled: boolean;
  hasApiKey: boolean;
  cachedLogCount: number;
  totalCostUsd: number;
  totalTokens: number;
  latestLogAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastIncrementalSyncAt: string | null;
  lastFullSyncAt: string | null;
  lastError: string | null;
}

export interface LogsQueryInput {
  accountId: string;
  page: number;
  pageSize: number;
  search?: string | null;
  model?: string | null;
  createdAfter?: string | null;
  createdBefore?: string | null;
}

export interface LogListItem {
  id: number;
  remoteLogId: string | null;
  modelName: string;
  reasoning: string;
  totalCostUsd: number;
  totalTokens: number;
  createdAt: string;
  rawJson: string;
}

export interface LogsQueryResponse {
  items: LogListItem[];
  page: number;
  pageSize: number;
  total: number;
}

export type AnalyticsGranularity = "hour" | "day";

export interface AnalyticsQueryInput {
  accountId: string;
  granularity: AnalyticsGranularity;
}

export interface ModelCostPoint {
  modelName: string;
  totalCostUsd: number;
  totalTokens: number;
  requestCount: number;
}

export interface TrendPoint {
  bucket: string;
  totalCostUsd: number;
  totalTokens: number;
  requestCount: number;
}

export interface AnalyticsResponse {
  modelBreakdown: ModelCostPoint[];
  trend: TrendPoint[];
}
