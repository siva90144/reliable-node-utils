import { describe, it, expect } from "vitest";
import { isDefined, isNonEmptyString, isPlainObject } from "../src/guards/index.js";

describe("isDefined", () => {
  it("returns false for null and undefined", () => {
    expect(isDefined(null)).toBe(false);
    expect(isDefined(undefined)).toBe(false);
  });

  it("returns true for other falsy values", () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined("")).toBe(true);
    expect(isDefined(false)).toBe(true);
  });

  it("returns true for objects and primitives", () => {
    expect(isDefined({})).toBe(true);
    expect(isDefined([])).toBe(true);
    expect(isDefined("hi")).toBe(true);
    expect(isDefined(42)).toBe(true);
  });

  it("narrows type in filter", () => {
    const arr: (string | undefined)[] = ["a", undefined, "b"];
    const defined: string[] = arr.filter(isDefined);
    expect(defined).toEqual(["a", "b"]);
  });
});

describe("isNonEmptyString", () => {
  it("returns false for null, undefined, non-strings", () => {
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
    expect(isNonEmptyString(0)).toBe(false);
    expect(isNonEmptyString({})).toBe(false);
    expect(isNonEmptyString("")).toBe(false);
  });

  it("returns true for non-empty strings", () => {
    expect(isNonEmptyString("a")).toBe(true);
    expect(isNonEmptyString("hello")).toBe(true);
    expect(isNonEmptyString(" ")).toBe(true);
  });
});

describe("isPlainObject", () => {
  it("returns true for {} and Object.create(null)", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
  });

  it("returns false for null, primitives, arrays", () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
    expect(isPlainObject("")).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(/a/)).toBe(false);
  });

  it("returns false for class instances", () => {
    class C {}
    expect(isPlainObject(new C())).toBe(false);
  });
});
