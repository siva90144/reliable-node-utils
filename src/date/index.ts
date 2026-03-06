import { isNullOrEmptyString } from "../string/index.js";

export type RelativeDateToken = "Today" | "Yesterday" | "Year";
export const EST_TIME_ZONE = "America/New_York";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function pad3(value: number): string {
  return String(value).padStart(3, "0");
}

function formatDate(date: Date, pattern: string): string {
  const tokenMap: Record<string, string> = {
    yyyy: String(date.getFullYear()),
    SSS: pad3(date.getMilliseconds()),
    MM: pad2(date.getMonth() + 1),
    dd: pad2(date.getDate()),
    HH: pad2(date.getHours()),
    mm: pad2(date.getMinutes()),
    ss: pad2(date.getSeconds()),
  };
  const tokens = Object.keys(tokenMap).sort((a, b) => b.length - a.length);

  let output = "";
  let inLiteral = false;
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i];

    if (char === "'") {
      const nextChar = pattern[i + 1];
      if (nextChar === "'") {
        output += "'";
        i += 2;
        continue;
      }
      inLiteral = !inLiteral;
      i += 1;
      continue;
    }

    if (inLiteral) {
      output += char;
      i += 1;
      continue;
    }

    const matchedToken = tokens.find((token) => pattern.startsWith(token, i));
    if (matchedToken) {
      output += tokenMap[matchedToken];
      i += matchedToken.length;
      continue;
    }

    output += char;
    i += 1;
  }

  return output;
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

/**
 * Format current time in a specific IANA timezone (HH:mm:ss).
 *
 * @param timeZone - IANA timezone (example: `America/New_York`)
 * @param now - Optional injection point for tests
 * @param locale - Optional locale for formatting
 */
export function getCurrentTimeInTimeZone(
  timeZone: string,
  now: Date = new Date(),
  locale = "en-US"
): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  return new Intl.DateTimeFormat(locale, options).format(now);
}

/**
 * Check if a timezone identifier is supported by the runtime.
 *
 * @param timeZone - IANA timezone (example: `America/New_York`)
 */
export function isValidTimeZone(timeZone: string): boolean {
  if (isNullOrEmptyString(timeZone)) {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date(0));
    return true;
  } catch (error) {
    if (error instanceof RangeError) {
      return false;
    }
    throw error;
  }
}

/**
 * Get current time in Eastern Time (America/New_York), formatted as HH:mm:ss.
 *
 * @param now - Optional injection point for tests
 * @param locale - Optional locale for formatting
 */
export function getCurrentTimeInEst(now: Date = new Date(), locale = "en-US"): string {
  return getCurrentTimeInTimeZone(EST_TIME_ZONE, now, locale);
}

/**
 * Backward-compatible alias for legacy naming.
 */
export const printCurrentTimeInEST = getCurrentTimeInEst;
