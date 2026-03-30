export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";
export type DashboardTab = "overview" | "logs";
export type TrendGranularity = "hour" | "day";

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

export interface DashboardErrorState {
  code: "MISSING_API_KEY" | "UNAUTHORIZED" | "NETWORK" | "UNKNOWN";
  section: "info" | "logs" | "global";
  message: string;
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

export function createEmptyDashboardState(): DashboardViewState {
  return {
    status: "loading",
    themeMode: "system",
    resolvedTheme: "dark",
    lastUpdatedAt: null,
    summary: null,
    charts: {
      breakdown: [],
      trend: []
    },
    logs: [],
    pagination: {
      page: 1,
      pageSize: 500,
      total: 0,
      hasMore: false,
      isLoadingMore: false,
      nextPage: 1
    },
    errors: []
  };
}
