import { describe, expect, it } from "vitest";

import { DateTimeService } from "./dateTimeService";

describe("DateTimeService", () => {
  it("parses common local input formats in the configured timezone", () => {
    const service = new DateTimeService("America/Los_Angeles");

    expect(service.toUtcISOStringFromLocalInput("2026/05/01 12:30")).toBe(
      "2026-05-01T19:30:00.000Z",
    );
    expect(service.toUtcISOStringFromLocalInput("2026-05-01T12:30")).toBe(
      "2026-05-01T19:30:00.000Z",
    );
    expect(service.toUtcISOStringFromLocalInput("2026/05/06 12:30", { boundary: "end" })).toBe(
      "2026-05-06T19:30:59.999Z",
    );
  });

  it("formats UTC values for display in the configured timezone", () => {
    const service = new DateTimeService("Asia/Shanghai");

    expect(service.formatDateTimeDisplay("2026-05-01T19:30:00.000Z")).toBe(
      "2026-05-02 03:30:00",
    );
    expect(service.formatDateDisplay("2026-03-29")).toBe("2026-03-29");
  });
});
