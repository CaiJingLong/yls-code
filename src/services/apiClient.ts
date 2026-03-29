import type { CodexInfoResponse, CodexLogsResponse } from "../types/api";

export type ApiErrorCode = "UNAUTHORIZED" | "NETWORK" | "UNKNOWN";

export class ApiClientError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export interface ApiClientOptions {
  apiKey: string;
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

export interface ApiClient {
  fetchInfo(): Promise<CodexInfoResponse>;
  fetchLogs(page: number, pageSize: number): Promise<CodexLogsResponse>;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = options.baseUrl.replace(/\/+$/, "");

  async function request<T>(path: string, searchParams?: URLSearchParams): Promise<T> {
    const url = new URL(`${baseUrl}${path}`);

    if (searchParams) {
      url.search = searchParams.toString();
    }

    let response: Response;

    try {
      response = await fetchImpl(url.toString(), {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${options.apiKey}`
        }
      });
    } catch (error) {
      throw new ApiClientError("NETWORK", error instanceof Error ? error.message : "Network request failed");
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new ApiClientError("UNAUTHORIZED", "Invalid API key", response.status);
      }

      throw new ApiClientError("UNKNOWN", `Request failed with status ${response.status}`, response.status);
    }

    return response.json() as Promise<T>;
  }

  return {
    fetchInfo() {
      return request<CodexInfoResponse>("/codex/info");
    },
    fetchLogs(page, pageSize) {
      return request<CodexLogsResponse>(
        "/codex/logs",
        new URLSearchParams({
          page: String(page),
          page_size: String(pageSize)
        })
      );
    }
  };
}
