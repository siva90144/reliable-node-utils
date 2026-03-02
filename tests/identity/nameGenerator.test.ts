import { describe, it, expect, beforeEach } from "vitest";
import {
  FakerNameProvider,
  StaticDatasetNameProvider,
  clearScopedInMemoryStores,
  generateFirstName,
  generateFullName,
  generateLastName,
  generateUniqueFirstName,
  generateUniqueFullName,
} from "../../src/identity/index.js";

describe("name generators", () => {
  beforeEach(() => {
    clearScopedInMemoryStores();
  });

  it("generates non-empty first, last, and full names", () => {
    const first = generateFirstName();
    const last = generateLastName();
    const full = generateFullName();
    expect(first.length).toBeGreaterThan(0);
    expect(last.length).toBeGreaterThan(0);
    expect(full.includes(" ")).toBe(true);
  });

  it("supports deterministic RNG for tests", () => {
    const first = generateFirstName({ rng: () => 0 });
    const last = generateLastName({ rng: () => 0 });
    expect(first).toBe("James");
    expect(last).toBe("Smith");
  });

  it("enforces uniqueness in scope for first names", async () => {
    const first = await generateUniqueFirstName({
      scope: "first-names",
      rng: () => 0,
    });
    const second = await generateUniqueFirstName({
      scope: "first-names",
      rng: () => 0.1,
    });
    expect(first).not.toBe(second);
  });

  it("enforces uniqueness in scope for full names", async () => {
    const a = await generateUniqueFullName({
      scope: "full-names",
      rng: () => 0,
    });
    const b = await generateUniqueFullName({
      scope: "full-names",
      rng: () => 0.2,
    });
    expect(a).not.toBe(b);
  });

  it("throws when maxAttempts is invalid", async () => {
    await expect(
      generateUniqueFullName({
        maxAttempts: 0,
      })
    ).rejects.toThrow(/maxAttempts/);
  });

  it("throws when uniqueness cannot be satisfied", async () => {
    await expect(
      generateUniqueFullName({
        maxAttempts: 2,
        store: {
          has: async () => true,
          add: async () => {},
        },
      })
    ).rejects.toThrow(/Unable to generate a unique value/);
  });

  it("supports custom provider implementations", () => {
    const provider = {
      firstName: () => "Alpha",
      lastName: () => "Beta",
    };
    expect(generateFirstName({ provider })).toBe("Alpha");
    expect(generateLastName({ provider })).toBe("Beta");
    expect(generateFullName({ provider })).toBe("Alpha Beta");
  });

  it("supports StaticDatasetNameProvider explicitly", () => {
    const provider = new StaticDatasetNameProvider();
    const first = generateFirstName({ provider, rng: () => 0 });
    const last = generateLastName({ provider, rng: () => 0 });
    expect(first).toBe("James");
    expect(last).toBe("Smith");
  });

  it("supports FakerNameProvider", () => {
    const provider = new FakerNameProvider({
      faker: {
        person: {
          firstName: () => "FakerFirst",
          lastName: () => "FakerLast",
        },
      },
    });
    expect(generateFirstName({ provider })).toBe("FakerFirst");
    expect(generateLastName({ provider })).toBe("FakerLast");
  });
});
