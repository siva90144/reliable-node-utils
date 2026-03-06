import { describe, expect, it } from "vitest";
import {
  EST_TIME_ZONE,
  getCurrentTimeInEst,
  getCurrentTimeInTimeZone,
  getDate,
  getRelativeDate,
  isValidTimeZone,
  printCurrentTimeInEST,
} from "../../src/date/index.js";

describe("date utils", () => {
  const fixedNow = new Date("2026-03-02T15:04:05.000Z");

  it("returns formatted relative dates", () => {
    expect(getRelativeDate("Today", "yyyy-MM-dd", fixedNow)).toBe("2026-03-02");
    expect(getRelativeDate("Yesterday", "yyyy-MM-dd", fixedNow)).toBe("2026-03-01");
    expect(getRelativeDate("Year", "yyyy-MM-dd", fixedNow)).toBe("2025-03-02");
  });

  it("supports time formatting tokens", () => {
    const out = getRelativeDate("Today", "yyyy/MM/dd HH:mm:ss", fixedNow);
    const expected = `${fixedNow.getFullYear()}/${String(fixedNow.getMonth() + 1).padStart(2, "0")}/${String(fixedNow.getDate()).padStart(2, "0")} ${String(fixedNow.getHours()).padStart(2, "0")}:${String(fixedNow.getMinutes()).padStart(2, "0")}:${String(fixedNow.getSeconds()).padStart(2, "0")}`;
    expect(out).toBe(expected);
  });

  it("supports quoted literals and millisecond token", () => {
    const out = getRelativeDate("Today", "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", fixedNow);
    const expected = `${fixedNow.getFullYear()}-${String(fixedNow.getMonth() + 1).padStart(2, "0")}-${String(fixedNow.getDate()).padStart(2, "0")}T${String(fixedNow.getHours()).padStart(2, "0")}:${String(fixedNow.getMinutes()).padStart(2, "0")}:${String(fixedNow.getSeconds()).padStart(2, "0")}.${String(fixedNow.getMilliseconds()).padStart(3, "0")}Z`;
    expect(out).toBe(expected);
  });

  it("defaults to today for unknown token and blank format", () => {
    expect(getDate("Unknown", "", fixedNow)).toBe("2026-03-02");
  });
});

describe("getDate (legacy alias)", () => {
  const fixedNow = new Date("2026-03-02T15:04:05.000Z");

  it("returns formatted relative dates", () => {
    expect(getDate("Today", "yyyy-MM-dd", fixedNow)).toBe("2026-03-02");
    expect(getDate("Yesterday", "yyyy-MM-dd", fixedNow)).toBe("2026-03-01");
    expect(getDate("Year", "yyyy-MM-dd", fixedNow)).toBe("2025-03-02");
  });

  it("falls back to default format when empty format is provided", () => {
    expect(getDate("Today", "", fixedNow)).toBe("2026-03-02");
  });

  it("supports quoted literals and millisecond token", () => {
    const out = getDate("Today", "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", fixedNow);
    const expected = `${fixedNow.getFullYear()}-${String(fixedNow.getMonth() + 1).padStart(2, "0")}-${String(fixedNow.getDate()).padStart(2, "0")}T${String(fixedNow.getHours()).padStart(2, "0")}:${String(fixedNow.getMinutes()).padStart(2, "0")}:${String(fixedNow.getSeconds()).padStart(2, "0")}.${String(fixedNow.getMilliseconds()).padStart(3, "0")}Z`;
    expect(out).toBe(expected);
  });
});

describe("timezone helpers", () => {
  const fixedUtcDate = new Date("2026-03-02T15:04:05.000Z");

  it("formats current time in a specific timezone", () => {
    const out = getCurrentTimeInTimeZone("America/New_York", fixedUtcDate);
    expect(out).toBe("10:04:05");
  });

  it("formats current time in EST using convenience helper", () => {
    const out = getCurrentTimeInEst(fixedUtcDate);
    expect(out).toBe("10:04:05");
  });

  it("supports legacy EST naming alias", () => {
    const out = printCurrentTimeInEST(fixedUtcDate);
    expect(out).toBe("10:04:05");
  });

  it("exports EST timezone constant", () => {
    expect(EST_TIME_ZONE).toBe("America/New_York");
  });

  it("supports UTC timezone formatting", () => {
    const out = getCurrentTimeInTimeZone("UTC", fixedUtcDate);
    expect(out).toBe("15:04:05");
  });

  it("supports Asia/Kolkata timezone formatting", () => {
    const out = getCurrentTimeInTimeZone("Asia/Kolkata", fixedUtcDate);
    expect(out).toBe("20:34:05");
  });

  it("validates a supported timezone", () => {
    expect(isValidTimeZone("America/New_York")).toBe(true);
  });

  it("returns false for unsupported timezone", () => {
    expect(isValidTimeZone("Not/A_Zone")).toBe(false);
  });

  it("returns false for empty timezone value", () => {
    expect(isValidTimeZone("")).toBe(false);
  });
});
