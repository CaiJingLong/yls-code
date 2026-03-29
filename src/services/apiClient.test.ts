import { describe, expect, it, vi } from "vitest";
import { ApiClientError, createApiClient } from "./apiClient";

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
});
