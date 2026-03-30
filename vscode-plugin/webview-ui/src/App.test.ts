import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.vue";

describe("App", () => {
  const postMessage = vi.fn();

  beforeEach(() => {
    postMessage.mockReset();
    (globalThis as typeof globalThis & { acquireVsCodeApi?: () => { postMessage: typeof postMessage } }).acquireVsCodeApi =
      () => ({
        postMessage,
        getState: () => undefined,
        setState: (state) => state
      });
  });

  it("renders overview and logs tabs with polling controls", async () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          ChartPanel: {
            template: '<div class="chart-stub" />'
          }
        }
      },
      props: {
        initialState: {
          status: "ready",
          themeMode: "system",
          resolvedTheme: "dark",
          lastUpdatedAt: null,
          summary: {
            remainingQuota: 83.891,
            usedQuota: 36.109,
            totalQuota: 120,
            requestCount: 483,
            packageLabel: "Pro",
            expiresAt: "2026-06-19T08:24:55.656Z"
          },
          charts: {
            breakdown: [],
            trend: []
          },
          logs: [
            {
              id: "1",
              model: "gpt-5.4",
              reasoning: "xhigh",
              totalTokens: 1000,
              totalCost: 0.12,
              createdAt: "2026-03-29T07:10:00.000Z"
            }
          ],
          pagination: {
            page: 1,
            pageSize: 500,
            total: 1,
            hasMore: false,
            isLoadingMore: false
          },
          errors: []
        }
      }
    });

    expect(wrapper.text()).toContain("83.891");
    expect(postMessage).toHaveBeenCalledWith({ type: "ready" });
    expect(wrapper.text()).toContain("概览");
    expect(wrapper.text()).toContain("最近记录");
    expect(wrapper.text()).toContain("自动轮询");
    expect(wrapper.text()).toContain("按小时");

    await wrapper.get('[data-tab="logs"]').trigger("click");

    expect(wrapper.text()).toContain("gpt-5.4");
  });

  it("switches from chart loading state to chart panels after receiving ready payload", async () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          ChartPanel: {
            props: ["title"],
            template: '<div class="chart-stub">{{ title }}</div>'
          }
        }
      },
      props: {
        initialState: {
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
        }
      }
    });

    expect(wrapper.text()).toContain("加载中...");

    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          type: "state",
          payload: {
            status: "ready",
            themeMode: "system",
            resolvedTheme: "dark",
            lastUpdatedAt: null,
            summary: {
              remainingQuota: 83.891,
              usedQuota: 36.109,
              totalQuota: 120,
              requestCount: 483,
              packageLabel: "Pro",
              expiresAt: "2026-06-19T08:24:55.656Z"
            },
            charts: {
              breakdown: [],
              trend: []
            },
            logs: [
              {
                id: "1",
                model: "gpt-5.4",
                reasoning: "xhigh",
                totalTokens: 1000,
                totalCost: 0.12,
                createdAt: "2026-03-29T07:10:00.000Z"
              }
            ],
            pagination: {
              page: 1,
              pageSize: 500,
              total: 1,
              hasMore: false,
              isLoadingMore: false,
              nextPage: null
            },
            errors: []
          }
        }
      })
    );

    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("模型成本构成");
    expect(wrapper.text()).toContain("美元成本趋势");
    expect(wrapper.text()).not.toContain("加载中...");
  });
});
