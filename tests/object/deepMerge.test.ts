import { describe, it, expect } from "vitest";
import { deepMerge } from "../../src/object/deepMerge.js";

describe("deepMerge", () => {
  it("merges shallow props", () => {
    const a = { x: 1, y: 2 };
    const b = { y: 3, z: 4 };
    expect(deepMerge(a, b)).toEqual({ x: 1, y: 3, z: 4 });
  });

  it("does not mutate inputs", () => {
    const a = { a: 1 };
    const b = { b: 2 };
    const out = deepMerge(a, b);
    expect(a).toEqual({ a: 1 });
    expect(b).toEqual({ b: 2 });
    expect(out).toEqual({ a: 1, b: 2 });
  });

  it("merges nested plain objects", () => {
    const a = { nested: { a: 1, b: 2 } };
    const b = { nested: { b: 3, c: 4 } };
    expect(deepMerge(a, b)).toEqual({ nested: { a: 1, b: 3, c: 4 } });
  });

  it("replaces arrays (no concat)", () => {
    const a = { arr: [1, 2] };
    const b = { arr: [3] };
    expect(deepMerge(a, b)).toEqual({ arr: [3] });
  });

  it("skips undefined in b", () => {
    const a = { x: 1, y: 2 };
    const b = { y: undefined };
    expect(deepMerge(a, b)).toEqual({ x: 1, y: 2 });
  });

  it("ignores prototype-manipulation keys", () => {
    const payload = JSON.parse(
      '{"safe":1,"__proto__":{"polluted":"yes"},"constructor":{"x":1},"prototype":{"x":1}}'
    ) as Record<string, unknown>;

    const merged = deepMerge({}, payload);

    expect(merged).toEqual({ safe: 1 });
    expect(Object.getPrototypeOf(merged)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
