import { describe, expect, it } from "vitest";

import { formatCompactNumber } from "./number";

describe("formatCompactNumber", () => {
  it("formats integers with compact units for large values", () => {
    expect(formatCompactNumber(950)).toBe("950");
    expect(formatCompactNumber(1000)).toBe("1k");
    expect(formatCompactNumber(1200)).toBe("1.2k");
    expect(formatCompactNumber(3456000)).toBe("3.5m");
    expect(formatCompactNumber(7800000000)).toBe("7.8b");
    expect(formatCompactNumber(1200000000000)).toBe("1.2t");
  });
});
