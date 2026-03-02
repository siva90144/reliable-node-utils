import { isNullOrEmptyString } from "../string/index.js";

export type RelativeDateToken = "Today" | "Yesterday" | "Year";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDate(date: Date, pattern: string): string {
  return pattern
    .replaceAll("yyyy", String(date.getFullYear()))
    .replaceAll("MM", pad2(date.getMonth() + 1))
    .replaceAll("dd", pad2(date.getDate()))
    .replaceAll("HH", pad2(date.getHours()))
    .replaceAll("mm", pad2(date.getMinutes()))
    .replaceAll("ss", pad2(date.getSeconds()));
}

/**
 * Get a formatted date for Today/Yesterday/Year(-1 year).
 *
 * @param token - Relative token
 * @param format - Pattern (default `yyyy-MM-dd`)
 * @param now - Optional injection point for tests
 */
export function getRelativeDate(
  token: RelativeDateToken | string,
  format = "yyyy-MM-dd",
  now: Date = new Date()
): string {
  const outputFormat = isNullOrEmptyString(format) ? "yyyy-MM-dd" : format;
  const date = new Date(now.getTime());

  switch (token) {
    case "Year":
      date.setFullYear(date.getFullYear() - 1);
      break;
    case "Yesterday":
      date.setDate(date.getDate() - 1);
      break;
    case "Today":
    default:
      break;
  }
  return formatDate(date, outputFormat);
}

/**
 * Backward-compatible alias for legacy naming.
 */
export const getDate = getRelativeDate;
