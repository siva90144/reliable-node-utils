import { describe, expect, it } from "vitest";
import {
  generateRandomAlphabeticString,
  generateRandomAlphanumericString,
  generateRandomNDigitNumber,
  generateRandomNumber,
  generateRandomString,
  getAlphaNumericString,
} from "../../src/random/index.js";

describe("random utils", () => {
  it("generates uppercase alphanumeric string by default", () => {
    const out = generateRandomAlphanumericString(6, { rng: () => 0 });
    expect(out).toHaveLength(6);
    expect(out).toMatch(/^[A-Z0-9]+$/);
    expect(getAlphaNumericString(4, { rng: () => 0.1 })).toHaveLength(4);
  });

  it("can generate mixed-case alphanumeric", () => {
    const out = generateRandomAlphanumericString(4, {
      uppercase: false,
      rng: () => 0.2,
    });
    expect(out).toHaveLength(4);
  });

  it("generates alphabetic strings only", () => {
    const out = generateRandomAlphabeticString(8, { rng: () => 0.3 });
    expect(out).toMatch(/^[A-Za-z]+$/);
    expect(generateRandomString(5, { rng: () => 0.4 })).toHaveLength(5);
  });

  it("generates random n-digit numbers", () => {
    const value = generateRandomNDigitNumber(3, { rng: () => 0 });
    expect(value).toBeGreaterThanOrEqual(100);
    expect(value).toBeLessThanOrEqual(999);
    expect(generateRandomNumber(2, { rng: () => 0.5 })).toBeGreaterThanOrEqual(10);
  });

  it("throws for invalid lengths", () => {
    expect(() => generateRandomAlphanumericString(0)).toThrow(/positive integer/);
    expect(() => generateRandomAlphabeticString(-1)).toThrow(/positive integer/);
    expect(() => generateRandomNDigitNumber(16)).toThrow(/<= 15/);
  });
});
