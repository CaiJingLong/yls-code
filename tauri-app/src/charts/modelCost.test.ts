import { describe, expect, it } from "vitest";

import { createModelCostOption } from "./modelCost";

describe("createModelCostOption", () => {
  it("includes the cost percentage in the pie tooltip", () => {
    const option = createModelCostOption(
      [
        {
          modelName: "gpt-5.4",
          totalCostUsd: 3,
          totalTokens: 300,
          requestCount: 3,
        },
        {
          modelName: "gpt-5.4-mini",
          totalCostUsd: 1,
          totalTokens: 100,
          requestCount: 1,
        },
      ],
      "light",
    );

    const tooltip = option.tooltip as {
      formatter: (params: { name: string; value: number }) => string;
    };

    expect(tooltip.formatter({ name: "gpt-5.4", value: 3 })).toContain("75.0%");
  });
});
