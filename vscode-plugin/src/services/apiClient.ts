import type { CodexInfoResponse, CodexLogsBatchResponse, CodexLogsResponse } from "../types/api";

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
  fetchLogs(page: number, pageSize: number): Promise<CodexLogsBatchResponse>;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const remotePageSizeLimit = 200;

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
    async fetchLogs(page, pageSize) {
      const dedupedItems = new Map<string, CodexLogsResponse["data"]["items"][number]>();
      let nextPage: number | null = page;
      let fetchedPages = 0;
      let total = 0;
      let message = "查询成功";
      let code = 200;

      while (nextPage !== null && dedupedItems.size < pageSize) {
        const remainingCount = pageSize - dedupedItems.size;
        const requestedPageSize = Math.min(remotePageSizeLimit, remainingCount);
        const response = await request<CodexLogsResponse>(
          "/codex/logs",
          new URLSearchParams({
            page: String(nextPage),
            page_size: String(requestedPageSize)
          })
        );

        code = response.code;
        message = response.msg;
        total = response.data.total;
        fetchedPages += 1;

        for (const item of response.data.items) {
          if (!dedupedItems.has(item._id)) {
            dedupedItems.set(item._id, item);
          }
        }

        const reachedEnd =
          response.data.items.length < response.data.page_size || response.data.page * response.data.page_size >= response.data.total;

        nextPage = reachedEnd ? null : response.data.page + 1;
      }

      return {
        code,
        msg: message,
        data: {
          items: [...dedupedItems.values()].slice(0, pageSize),
          page,
          page_size: pageSize,
          requested_count: pageSize,
          fetched_pages: fetchedPages,
          total,
          next_page: nextPage
        }
      } satisfies CodexLogsBatchResponse;
    }
  };
}
