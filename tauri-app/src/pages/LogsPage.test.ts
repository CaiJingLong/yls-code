import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Quasar } from "quasar";

import LogsPage from "./LogsPage.vue";
import type { LogsQueryInput } from "../types/query";

const { queryLogsMock } = vi.hoisted(() => ({
  queryLogsMock: vi.fn(async () => ({
    items: [],
    page: 1,
    pageSize: 50,
    total: 0,
  })),
}));

vi.mock("../lib/tauri/query", () => ({
  queryLogs: queryLogsMock,
}));

vi.mock("../stores/accounts", () => ({
  accountsStore: {
    state: {
      activeAccountId: "acct-test",
    },
  },
}));

vi.mock("../stores/sync", () => ({
  syncStore: {
    state: {
      progress: null,
    },
  },
}));

vi.mock("../components/logs/LogsTable.vue", () => ({
  default: {
    template: "<div data-testid='logs-table' />",
    props: ["items"],
  },
}));

describe("LogsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    queryLogsMock.mockClear();
  });

  function mountPage() {
    return mount(LogsPage, {
      global: {
        plugins: [[Quasar, {}]],
      },
    });
  }

  function latestLogsCall() {
    const calls = queryLogsMock.mock.calls as unknown as [LogsQueryInput][];
    const lastCall = calls[calls.length - 1];
    expect(lastCall).toBeDefined();

    return lastCall![0];
  }

  it("restores and persists log filters from localStorage", async () => {
    localStorage.setItem(
      "yls-workbench.logs.filters",
      JSON.stringify({
        search: "reasoning",
        model: "gpt-5.4",
        createdAfter: "2026-05-01T12:30",
        createdBefore: "2026-05-06T12:30",
        pageSize: 50,
      }),
    );

    const wrapper = mountPage();
    await flushPromises();

    const inputs = wrapper.findAll("input");
    expect(inputs[0]!.element.value).toBe("reasoning");
    expect(inputs[1]!.element.value).toBe("gpt-5.4");
    expect(wrapper.findAllComponents({ name: "DateTimePicker" })).toHaveLength(2);
    expect(latestLogsCall()).toMatchObject({
      search: "reasoning",
      model: "gpt-5.4",
    });

    await inputs[0]!.setValue("mini");
    await flushPromises();

    expect(JSON.parse(localStorage.getItem("yls-workbench.logs.filters") ?? "{}")).toMatchObject({
      search: "mini",
      model: "gpt-5.4",
      createdAfter: "2026-05-01T12:30",
      createdBefore: "2026-05-06T12:30",
      pageSize: 50,
    });
  });
});
