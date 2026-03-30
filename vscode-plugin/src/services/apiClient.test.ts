import { describe, expect, it, vi } from "vitest";
import { ApiClientError, createApiClient } from "./apiClient";
import type { CodexLogItem } from "../types/api";

function createLogItem(index: number, model = "gpt-5.4"): CodexLogItem {
  return {
    _id: `log-${index}`,
    type: "subscription",
    model,
    reasoning: "xhigh",
    input_tokens: 1000 + index,
    input_tokens_cached: 500 + index,
    input_cache_creation_tokens: 0,
    output_tokens: 200 + index,
    output_tokens_reasoning: 100 + index,
    total_tokens: 1200 + index,
    input_cost: 0.001,
    output_cost: 0.002,
    cache_creation_cost: 0,
    cache_read_cost: 0.003,
    total_cost: 0.006,
    createdAt: `2026-03-29T15:${String(index % 60).padStart(2, "0")}:00.000Z`,
    updatedAt: `2026-03-29T15:${String(index % 60).padStart(2, "0")}:00.000Z`
  };
}

describe("createApiClient", () => {
  it("sends bearer token and parses info response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 200,
        state: {
          userPackgeUsage: {
            remaining_quota: 10
          }
        }
      })
    });

    const client = createApiClient({
      apiKey: "test-key",
      baseUrl: "https://code.ylsagi.com",
      fetchImpl: fetchMock
    });

    const result = await client.fetchInfo();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://code.ylsagi.com/codex/info",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-key"
        })
      })
    );
    expect(result.state.userPackgeUsage.remaining_quota).toBe(10);
  });

  it("maps 401 responses to unauthorized errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({})
    });

    const client = createApiClient({
      apiKey: "test-key",
      baseUrl: "https://code.ylsagi.com",
      fetchImpl: fetchMock
    });

    await expect(client.fetchLogs(1, 10)).rejects.toMatchObject<ApiClientError>({
      code: "UNAUTHORIZED"
    });
  });

  it("fetches multiple pages, deduplicates, and fills requested log count", async () => {
    const firstPageItems = Array.from({ length: 200 }, (_, index) => createLogItem(index));
    const secondPageItems = [createLogItem(199), ...Array.from({ length: 200 }, (_, index) => createLogItem(index + 200))];
    const thirdPageItems = Array.from({ length: 100 }, (_, index) => createLogItem(index + 400));

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 200,
          msg: "ok",
          data: { items: firstPageItems, page: 1, page_size: 200, total: 999 }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 200,
          msg: "ok",
          data: { items: secondPageItems, page: 2, page_size: 200, total: 999 }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 200,
          msg: "ok",
          data: { items: thirdPageItems, page: 3, page_size: 100, total: 999 }
        })
      });

    const client = createApiClient({
      apiKey: "test-key",
      baseUrl: "https://code.ylsagi.com",
      fetchImpl: fetchMock
    });

    const response = await client.fetchLogs(1, 500);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://code.ylsagi.com/codex/logs?page=1&page_size=200",
      expect.anything()
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://code.ylsagi.com/codex/logs?page=2&page_size=200",
      expect.anything()
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://code.ylsagi.com/codex/logs?page=3&page_size=100",
      expect.anything()
    );
    expect(response.data.items).toHaveLength(500);
    expect(new Set(response.data.items.map((item) => item._id)).size).toBe(500);
    expect(response.data.next_page).toBe(4);
    expect(response.data.fetched_pages).toBe(3);
  });
});
