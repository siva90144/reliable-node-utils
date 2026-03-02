import { describe, it, expect, vi } from "vitest";
import { memoize } from "../../src/fn/memoize.js";

describe("memoize", () => {
  it("returns same result for same args", () => {
    const fn = vi.fn((x: number, y: number) => x + y);
    const m = memoize(fn);
    expect(m(1, 2)).toBe(3);
    expect(m(1, 2)).toBe(3);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("uses keyFn when provided", () => {
    const fn = vi.fn((id: string) => id.toUpperCase());
    const m = memoize(fn, { keyFn: (id) => id });
    expect(m("a")).toBe("A");
    expect(m("a")).toBe("A");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("evicts by LRU when maxSize is set", () => {
    const fn = vi.fn((x: number) => x);
    const m = memoize(fn, { maxSize: 2 });
    m(1);
    m(2);
    m(1);
    expect(fn).toHaveBeenCalledTimes(2);
    m(3);
    m(1);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("expires entries after ttlMs", async () => {
    vi.useFakeTimers();
    const fn = vi.fn((x: number) => x);
    const m = memoize(fn, { ttlMs: 50 });
    expect(m(1)).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(40);
    expect(m(1)).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(20);
    expect(m(1)).toBe(1);
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("caches undefined return values", () => {
    const fn = vi.fn((_key: string) => undefined);
    const m = memoize(fn, { keyFn: (key) => key });

    expect(m("a")).toBeUndefined();
    expect(m("a")).toBeUndefined();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
