import { describe, expect, it } from "vitest";
import { createCostBreakdownOption } from "./costBreakdown";

describe("createCostBreakdownOption", () => {
  it("maps model labels to echarts pie item names", () => {
    const option = createCostBreakdownOption(
      [
        { label: "gpt-5.4", value: 1.23 },
        { label: "gpt-5.4-mini", value: 0.45 }
      ],
      "dark"
    );

    const pieSeries = Array.isArray(option.series) ? option.series[0] : undefined;
    const data = Array.isArray(pieSeries?.data) ? pieSeries.data : [];

    expect(data).toEqual([
      { name: "gpt-5.4", value: 1.23 },
      { name: "gpt-5.4-mini", value: 0.45 }
    ]);
  });
});
