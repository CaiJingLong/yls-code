import type { AnalyticsGranularity } from "../types/query";

type DateInput = string | number | Date | null | undefined;

interface DateFormatOptions {
  timeZone?: string;
}

interface DateParts {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UNIX_SECONDS_PATTERN = /^\d{10}$/;
const UNIX_MILLISECONDS_PATTERN = /^\d{13}$/;
let displayTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";

function resolveTimeZone(options?: DateFormatOptions) {
  return options?.timeZone ?? displayTimeZone;
}

function toDate(value: Exclude<DateInput, null | undefined>, timeZone?: string): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const timestamp = value < 1_000_000_000_000 ? value * 1000 : value;
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (DATE_ONLY_PATTERN.test(normalized)) {
    const date = new Date(`${normalized}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (UNIX_SECONDS_PATTERN.test(normalized) || UNIX_MILLISECONDS_PATTERN.test(normalized)) {
    return toDate(Number(normalized), timeZone);
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDateParts(value: DateInput, options?: DateFormatOptions): DateParts | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "string" && DATE_ONLY_PATTERN.test(value.trim())) {
    const normalized = value.trim();
    return {
      year: normalized.slice(0, 4),
      month: normalized.slice(5, 7),
      day: normalized.slice(8, 10),
      hour: "00",
      minute: "00",
      second: "00",
    };
  }

  const date = toDate(value, options?.timeZone);
  if (!date) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat(undefined, {
    timeZone: resolveTimeZone(options),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);

  return {
    year: parts.find((part) => part.type === "year")?.value ?? "0000",
    month: parts.find((part) => part.type === "month")?.value ?? "00",
    day: parts.find((part) => part.type === "day")?.value ?? "00",
    hour: parts.find((part) => part.type === "hour")?.value ?? "00",
    minute: parts.find((part) => part.type === "minute")?.value ?? "00",
    second: parts.find((part) => part.type === "second")?.value ?? "00",
  };
}

export function formatDateTimeDisplay(value: DateInput, options?: DateFormatOptions) {
  const parts = getDateParts(value, options);
  if (!parts) {
    return null;
  }

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

export function formatDateDisplay(value: DateInput, options?: DateFormatOptions) {
  const parts = getDateParts(value, options);
  if (!parts) {
    return null;
  }

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatTrendBucketAxisLabel(
  bucket: string,
  granularity: AnalyticsGranularity,
  options?: DateFormatOptions,
) {
  const dateText =
    granularity === "day"
      ? formatDateDisplay(bucket, options)
      : formatDateTimeDisplay(bucket, options);

  if (!dateText) {
    return bucket;
  }

  if (granularity === "day") {
    return dateText.slice(5);
  }

  return `${dateText.slice(5, 10)} ${dateText.slice(11, 16)}`;
}

export function formatTrendBucketTooltipLabel(
  bucket: string,
  granularity: AnalyticsGranularity,
  options?: DateFormatOptions,
) {
  return granularity === "day"
    ? formatDateDisplay(bucket, options) ?? bucket
    : formatDateTimeDisplay(bucket, options) ?? bucket;
}

export function setDisplayTimeZone(timeZone: string | null | undefined) {
  if (!timeZone) {
    return;
  }

  displayTimeZone = timeZone;
}

export function getDisplayTimeZone() {
  return displayTimeZone;
}

export function toUtcISOStringFromLocalInput(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}
