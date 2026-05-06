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

  it("uses the app-wide display timezone when converting local inputs back to UTC", () => {
    const originalTimeZone = getDisplayTimeZone();

    try {
      setDisplayTimeZone("America/Los_Angeles");
      expect(formatDateTimeDisplay("2026-05-06T07:00:00.000Z")).toBe("2026-05-06 00:00:00");
      expect(toUtcISOStringFromLocalInput("2026-05-06T00:00")).toBe("2026-05-06T07:00:00.000Z");
      expect(toUtcISOStringFromLocalInput("2026-05-06 00:00:30")).toBe(
        "2026-05-06T07:00:30.000Z",
      );
      expect(toUtcISOStringFromLocalInput("2026-05-06T23:59", { boundary: "end" })).toBe(
        "2026-05-07T06:59:59.999Z",
      );
      expect(toUtcISOStringFromLocalInput("2026-05-06", { boundary: "end" })).toBe(
        "2026-05-07T06:59:59.999Z",
      );
    } finally {
      setDisplayTimeZone(originalTimeZone);
    }
  });
});
