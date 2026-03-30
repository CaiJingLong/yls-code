import { describe, expect, it } from "vitest";

import {
  formatDateDisplay,
  formatDateTimeDisplay,
  formatTrendBucketAxisLabel,
  formatTrendBucketTooltipLabel,
  getDisplayTimeZone,
  setDisplayTimeZone,
  toUtcISOStringFromLocalInput,
} from "./datetime";

describe("datetime helpers", () => {
  it("formats unix seconds and ISO strings into local datetime text", () => {
    expect(formatDateTimeDisplay("1774851324", { timeZone: "Asia/Shanghai" })).toBe(
      "2026-03-30 14:15:24",
    );
    expect(
      formatDateTimeDisplay("2026-03-29T15:01:00.000Z", { timeZone: "Asia/Shanghai" }),
    ).toBe("2026-03-29 23:01:00");
  });

  it("keeps pure date buckets stable and formats trend labels", () => {
    expect(formatDateDisplay("2026-03-29", { timeZone: "America/Los_Angeles" })).toBe(
      "2026-03-29",
    );
    expect(
      formatTrendBucketAxisLabel("2026-03-29T10:00:00Z", "hour", { timeZone: "Asia/Shanghai" }),
    ).toBe("03-29 18:00");
    expect(formatTrendBucketAxisLabel("2026-03-29", "day")).toBe("03-29");
    expect(
      formatTrendBucketTooltipLabel("2026-03-29T10:00:00Z", "hour", {
        timeZone: "Asia/Shanghai",
      }),
    ).toBe("2026-03-29 18:00:00");
  });

  it("supports an app-wide display timezone and converts local inputs back to UTC", () => {
    const originalTimeZone = getDisplayTimeZone();
    const originalProcessTimeZone = process.env.TZ;

    try {
      process.env.TZ = "Asia/Shanghai";
      setDisplayTimeZone("Asia/Shanghai");
      expect(formatDateTimeDisplay("2026-03-29T15:01:00.000Z")).toBe("2026-03-29 23:01:00");
      expect(toUtcISOStringFromLocalInput("2026-03-29T23:01")).toBe("2026-03-29T15:01:00.000Z");
    } finally {
      process.env.TZ = originalProcessTimeZone;
      setDisplayTimeZone(originalTimeZone);
    }
  });
});
