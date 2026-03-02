import { describe, expect, it } from "vitest";
import { getDate, getRelativeDate } from "../../src/date/index.js";

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

  it("defaults to today for unknown token and blank format", () => {
    expect(getDate("Unknown", "", fixedNow)).toBe("2026-03-02");
  });
});
