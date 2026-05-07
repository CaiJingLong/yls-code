const COMPACT_UNITS = [
  { value: 1_000_000_000_000, suffix: "t" },
  { value: 1_000_000_000, suffix: "b" },
  { value: 1_000_000, suffix: "m" },
  { value: 1_000, suffix: "k" },
] as const;

export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const sign = value < 0 ? "-" : "";
  const absoluteValue = Math.abs(value);

  if (absoluteValue < 1000) {
    return `${sign}${Math.round(absoluteValue)}`;
  }

  for (const unit of COMPACT_UNITS) {
    if (absoluteValue >= unit.value) {
      const compactValue = (absoluteValue / unit.value).toFixed(1).replace(/\.0$/, "");
      return `${sign}${compactValue}${unit.suffix}`;
    }
  }

  return `${sign}${Math.round(absoluteValue)}`;
}
