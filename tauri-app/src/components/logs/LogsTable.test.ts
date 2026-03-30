import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import LogsTable from "./LogsTable.vue";

describe("LogsTable", () => {
  it("formats created times instead of rendering raw epoch and ISO strings", () => {
    const wrapper = mount(LogsTable, {
      props: {
        items: [
          {
            id: 1,
            remoteLogId: "log-1",
            modelName: "gpt-5.4",
            reasoning: "xhigh",
            totalCostUsd: 0.12,
            totalTokens: 1234,
            createdAt: "1774851324",
            rawJson: "{}",
          },
          {
            id: 2,
            remoteLogId: "log-2",
            modelName: "gpt-5.4-mini",
            reasoning: "",
            totalCostUsd: 0.02,
            totalTokens: 456,
            createdAt: "2026-03-29T15:01:00.000Z",
            rawJson: "{}",
          },
        ],
      },
    });

    expect(wrapper.text()).not.toContain("1774851324");
    expect(wrapper.text()).not.toContain("2026-03-29T15:01:00.000Z");
  });
});
