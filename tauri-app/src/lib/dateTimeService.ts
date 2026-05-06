import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import type { AnalyticsGranularity } from "../types/query";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

export type DateTimeInput = string | number | Date | null | undefined;

export interface DateTimeFormatOptions {
  timeZone?: string;
}

export interface LocalInputConversionOptions {
  boundary?: "start" | "end";
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UNIX_SECONDS_PATTERN = /^\d{10}$/;
const UNIX_MILLISECONDS_PATTERN = /^\d{13}$/;
const LOCAL_DATE_TIME_FORMATS = [
  { pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, format: "YYYY-MM-DDTHH:mm:ss" },
  { pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, format: "YYYY-MM-DDTHH:mm" },
  { pattern: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, format: "YYYY-MM-DD HH:mm:ss" },
  { pattern: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/, format: "YYYY-MM-DD HH:mm" },
  { pattern: /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/, format: "YYYY/MM/DD HH:mm:ss" },
  { pattern: /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/, format: "YYYY/MM/DD HH:mm" },
  { pattern: /^\d{4}-\d{2}-\d{2}$/, format: "YYYY-MM-DD" },
  { pattern: /^\d{4}\/\d{2}\/\d{2}$/, format: "YYYY/MM/DD" },
];

export class DateTimeService {
  constructor(private displayTimeZone = dayjs.tz.guess() || "UTC") {}

  setDisplayTimeZone(timeZone: string | null | undefined) {
    if (!timeZone) {
      return;
    }

    this.displayTimeZone = timeZone;
  }

  getDisplayTimeZone() {
    return this.displayTimeZone;
  }

  formatDateTimeDisplay(value: DateTimeInput, options?: DateTimeFormatOptions) {
    const date = this.toDayjs(value, options);
    return date?.format("YYYY-MM-DD HH:mm:ss") ?? null;
  }

  formatDateDisplay(value: DateTimeInput, options?: DateTimeFormatOptions) {
    if (typeof value === "string" && DATE_ONLY_PATTERN.test(value.trim())) {
      return value.trim();
    }

    const date = this.toDayjs(value, options);
    return date?.format("YYYY-MM-DD") ?? null;
  }

  formatTrendBucketAxisLabel(
    bucket: string,
    granularity: AnalyticsGranularity,
    options?: DateTimeFormatOptions,
  ) {
    const dateText =
      granularity === "day"
        ? this.formatDateDisplay(bucket, options)
        : this.formatDateTimeDisplay(bucket, options);

    if (!dateText) {
      return bucket;
    }

    if (granularity === "day") {
      return dateText.slice(5);
    }

    return `${dateText.slice(5, 10)} ${dateText.slice(11, 16)}`;
  }

  formatTrendBucketTooltipLabel(
    bucket: string,
    granularity: AnalyticsGranularity,
    options?: DateTimeFormatOptions,
  ) {
    return granularity === "day"
      ? this.formatDateDisplay(bucket, options) ?? bucket
      : this.formatDateTimeDisplay(bucket, options) ?? bucket;
  }

  toUtcISOStringFromLocalInput(
    value: string | null | undefined,
    options?: LocalInputConversionOptions,
  ) {
    const normalized = value?.trim();
    if (!normalized) {
      return null;
    }

    const date = this.parseLocalInput(normalized);
    if (!date.isValid()) {
      return null;
    }

    const boundary = options?.boundary ?? "start";
    const bounded =
      boundary === "end"
        ? this.applyEndBoundary(date, normalized)
        : date.millisecond(0);

    return bounded.utc().toISOString();
  }

  private resolveTimeZone(options?: DateTimeFormatOptions) {
    return options?.timeZone ?? this.displayTimeZone;
  }

  private toDayjs(value: DateTimeInput, options?: DateTimeFormatOptions): Dayjs | null {
    if (value == null) {
      return null;
    }

    const timeZone = this.resolveTimeZone(options);

    if (value instanceof Date) {
      const date = dayjs(value);
      return date.isValid() ? date.tz(timeZone) : null;
    }

    if (typeof value === "number") {
      const timestamp = value < 1_000_000_000_000 ? value * 1000 : value;
      const date = dayjs(timestamp);
      return date.isValid() ? date.tz(timeZone) : null;
    }

    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    if (DATE_ONLY_PATTERN.test(normalized)) {
      const date = dayjs.tz(normalized, "YYYY-MM-DD", timeZone);
      return date.isValid() ? date : null;
    }

    if (UNIX_SECONDS_PATTERN.test(normalized) || UNIX_MILLISECONDS_PATTERN.test(normalized)) {
      return this.toDayjs(Number(normalized), options);
    }

    const date = dayjs(normalized);
    return date.isValid() ? date.tz(timeZone) : null;
  }

  private parseLocalInput(value: string) {
    for (const { pattern, format } of LOCAL_DATE_TIME_FORMATS) {
      if (!pattern.test(value)) {
        continue;
      }

      const parsed = dayjs.tz(value, format, this.displayTimeZone);
      if (parsed.isValid() && parsed.format(format) === value) {
        return parsed;
      }

      return dayjs(Number.NaN);
    }

    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.tz(this.displayTimeZone) : parsed;
  }

  private applyEndBoundary(date: Dayjs, rawValue: string) {
    if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(rawValue)) {
      return date.hour(23).minute(59).second(59).millisecond(999);
    }

    if (/^\d{4}[-/]\d{2}[-/]\d{2}[T\s]\d{2}:\d{2}$/.test(rawValue)) {
      return date.second(59).millisecond(999);
    }

    if (/^\d{4}[-/]\d{2}[-/]\d{2}[T\s]\d{2}:\d{2}:\d{2}$/.test(rawValue)) {
      return date.millisecond(999);
    }

    return date;
  }
}

export const dateTimeService = new DateTimeService();
