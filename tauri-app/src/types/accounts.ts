export interface AccountSummary {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  hasApiKey: boolean;
}

export interface SaveAccountInput {
  id?: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  enabled?: boolean;
}
