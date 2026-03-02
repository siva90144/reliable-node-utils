import { describe, it, expect, vi } from "vitest";
import { pLimit } from "../../src/async/pLimit.js";

describe("pLimit", () => {
  it("limits concurrency to 1", async () => {
    const limit = pLimit(1);
    let running = 0;
    const fn = vi.fn(async () => {
      running++;
      expect(running).toBe(1);
      await new Promise((r) => setTimeout(r, 10));
      running--;
      return 1;
    });
    const results = await Promise.all([limit(fn), limit(fn), limit(fn)]);
    expect(results).toEqual([1, 1, 1]);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("allows up to N concurrent", async () => {
    const limit = pLimit(2);
    const order: number[] = [];
    const make = (n: number) =>
      limit(async () => {
        order.push(n);
        await new Promise((r) => setTimeout(r, 5));
        return n;
      });
    const results = await Promise.all([make(1), make(2), make(3)]);
    expect(results.sort()).toEqual([1, 2, 3]);
    expect(order[0]).toBe(1);
    expect(order[1]).toBe(2);
    expect(order[2]).toBe(3);
  });

  it("passes arguments to fn", async () => {
    const limit = pLimit(2);
    const result = await limit(async (x: number, y: number) => x + y, 3, 4);
    expect(result).toBe(7);
  });

  it("throws if concurrency is invalid", () => {
    expect(() => pLimit(0)).toThrow(TypeError);
    expect(() => pLimit(-1)).toThrow(TypeError);
    expect(() => pLimit(NaN)).toThrow(TypeError);
    expect(() => pLimit(Infinity)).toThrow(TypeError);
  });
});
