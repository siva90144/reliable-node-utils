import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withTimeout } from "../../src/async/withTimeout.js";
import { AbortError, TimeoutError } from "../../src/errors.js";

describe("withTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns value when promise resolves before timeout", async () => {
    const p = withTimeout(Promise.resolve(42), 5000);
    await expect(p).resolves.toBe(42);
  });

  it("accepts function that returns promise", async () => {
    const fn = vi.fn().mockResolvedValue("fn");
    const result = await withTimeout(fn, 5000);
    expect(result).toBe("fn");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throws TimeoutError when timeout is exceeded", async () => {
    const never = new Promise<never>(() => {});
    const p = withTimeout(never, 100);
    vi.advanceTimersByTimeAsync(100);
    await expect(p).rejects.toThrow(TimeoutError);
    await expect(p).rejects.toThrow(/timed out after 100ms/);
  });

  it("preserves original rejection when operation fails first", async () => {
    const err = new Error("boom");
    await expect(withTimeout(Promise.reject(err), 1000)).rejects.toBe(err);
  });

  it("throws AbortError when signal is aborted", async () => {
    const ac = new AbortController();
    const never = new Promise<never>(() => {});
    const p = withTimeout(never, 10_000, { signal: ac.signal });
    const result = p.catch((e) => e);
    ac.abort();
    await vi.advanceTimersByTimeAsync(0);
    const err = await result;
    expect(err).toBeInstanceOf(AbortError);
  });

  it("throws AbortError when signal already aborted", async () => {
    const ac = new AbortController();
    ac.abort();
    await expect(
      withTimeout(Promise.resolve(1), 1000, { signal: ac.signal })
    ).rejects.toThrow(AbortError);
  });

  it("rejects invalid timeout values", async () => {
    await expect(withTimeout(Promise.resolve(1), -1)).rejects.toThrow(/ms/);
    await expect(withTimeout(Promise.resolve(1), Number.NaN)).rejects.toThrow(/ms/);
  });

  it("does not invoke callback when already aborted", async () => {
    const ac = new AbortController();
    ac.abort();
    const fn = vi.fn().mockResolvedValue("value");

    await expect(withTimeout(fn, 1000, { signal: ac.signal })).rejects.toThrow(
      AbortError
    );
    expect(fn).not.toHaveBeenCalled();
  });
});
