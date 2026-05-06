import {
  dateTimeService,
  type DateTimeFormatOptions,
  type DateTimeInput,
  type LocalInputConversionOptions,
} from "./dateTimeService";
import type { AnalyticsGranularity } from "../types/query";

export type { DateTimeFormatOptions, DateTimeInput, LocalInputConversionOptions };

export function formatDateTimeDisplay(value: DateTimeInput, options?: DateTimeFormatOptions) {
  return dateTimeService.formatDateTimeDisplay(value, options);
}

export function formatDateDisplay(value: DateTimeInput, options?: DateTimeFormatOptions) {
  return dateTimeService.formatDateDisplay(value, options);
}

export function formatTrendBucketAxisLabel(
  bucket: string,
  granularity: AnalyticsGranularity,
  options?: DateTimeFormatOptions,
) {
  return dateTimeService.formatTrendBucketAxisLabel(bucket, granularity, options);
}

export function formatTrendBucketTooltipLabel(
  bucket: string,
  granularity: AnalyticsGranularity,
  options?: DateTimeFormatOptions,
) {
  return dateTimeService.formatTrendBucketTooltipLabel(bucket, granularity, options);
}

export function setDisplayTimeZone(timeZone: string | null | undefined) {
  dateTimeService.setDisplayTimeZone(timeZone);
}

export function getDisplayTimeZone() {
  return dateTimeService.getDisplayTimeZone();
}

export function toUtcISOStringFromLocalInput(
  value: string | null | undefined,
  options?: LocalInputConversionOptions,
) {
  return dateTimeService.toUtcISOStringFromLocalInput(value, options);
}
