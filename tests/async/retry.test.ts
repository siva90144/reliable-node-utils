import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { retry } from "../../src/async/retry.js";
import { AbortError, RetryExhaustedError } from "../../src/errors.js";

describe("retry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns result on first success", async () => {
    const fn = vi.fn().mockResolvedValue(42);
    const p = retry(fn, { maxAttempts: 3 });
    await expect(p).resolves.toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and resolves when later attempt succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue(100);
    const p = retry(fn, { maxAttempts: 5, baseDelayMs: 10, jitter: false });
    vi.advanceTimersByTimeAsync(0);
    const resultPromise = p;
    await vi.advanceTimersByTimeAsync(10);
    await vi.advanceTimersByTimeAsync(20);
    await expect(resultPromise).resolves.toBe(100);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws RetryExhaustedError when all attempts fail", async () => {
    const err = new Error("nope");
    const fn = vi.fn().mockRejectedValue(err);
    const p = retry(fn, { maxAttempts: 2, baseDelayMs: 10, jitter: false });
    vi.advanceTimersByTimeAsync(10);
    await expect(p).rejects.toThrow(RetryExhaustedError);
    await expect(p).rejects.toMatchObject({
      attempt: 2,
      lastError: err,
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("calls onRetry before each retry", async () => {
    const onRetry = vi.fn();
    const fn = vi.fn().mockRejectedValueOnce(new Error("1")).mockResolvedValue("ok");
    const p = retry(fn, {
      maxAttempts: 3,
      baseDelayMs: 10,
      jitter: false,
      onRetry,
    });
    await vi.advanceTimersByTimeAsync(10);
    await expect(p).resolves.toBe("ok");
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it("throws AbortError when signal is aborted before start", async () => {
    const ac = new AbortController();
    ac.abort();
    const fn = vi.fn().mockResolvedValue(1);
    await expect(retry(fn, { signal: ac.signal })).rejects.toThrow(AbortError);
    expect(fn).not.toHaveBeenCalled();
  });

  it("throws AbortError when signal is aborted during delay", async () => {
    const ac = new AbortController();
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    const p = retry(fn, {
      maxAttempts: 3,
      baseDelayMs: 1000,
      jitter: false,
      signal: ac.signal,
    });
    const result = p.catch((e) => e);
    await vi.advanceTimersByTimeAsync(0);
    ac.abort();
    await vi.advanceTimersByTimeAsync(0);
    const err = await result;
    expect(err).toBeInstanceOf(AbortError);
  });

  it("rejects invalid retry options", async () => {
    const fn = vi.fn().mockResolvedValue("ok");

    await expect(
      retry(fn, { maxAttempts: 0, baseDelayMs: 10, maxDelayMs: 100 })
    ).rejects.toThrow(/maxAttempts/);
    await expect(
      retry(fn, { maxAttempts: 1, baseDelayMs: -1, maxDelayMs: 100 })
    ).rejects.toThrow(/baseDelayMs/);
    await expect(
      retry(fn, { maxAttempts: 1, baseDelayMs: 10, maxDelayMs: 5 })
    ).rejects.toThrow(/maxDelayMs/);
    await expect(
      retry(fn, {
        maxAttempts: 1,
        baseDelayMs: 10,
        maxDelayMs: 100,
        onRetry: "nope" as unknown as (attempt: number, error: unknown) => void,
      })
    ).rejects.toThrow(/onRetry/);
  });

  it("aborts after onRetry before scheduling next delay", async () => {
    const ac = new AbortController();
    const fn = vi.fn().mockRejectedValue(new Error("fail"));

    const p = retry(fn, {
      maxAttempts: 3,
      baseDelayMs: 50,
      maxDelayMs: 100,
      signal: ac.signal,
      onRetry: () => {
        ac.abort();
      },
    });

    await expect(p).rejects.toThrow(AbortError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("uses jitter branch when enabled", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    const fn = vi.fn().mockRejectedValueOnce(new Error("fail")).mockResolvedValue("ok");

    const p = retry(fn, {
      maxAttempts: 2,
      baseDelayMs: 10,
      maxDelayMs: 20,
      jitter: true,
    });
    await vi.advanceTimersByTimeAsync(0);
    await expect(p).resolves.toBe("ok");
    expect(randomSpy).toHaveBeenCalled();
    randomSpy.mockRestore();
  });
});
