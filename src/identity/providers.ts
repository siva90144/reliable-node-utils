import { faker as defaultFaker } from "@faker-js/faker";
import { COMMON_FIRST_NAMES, COMMON_LAST_NAMES } from "./namesData.js";

export interface NameProvider {
  firstName(options?: { rng?: () => number }): string;
  lastName(options?: { rng?: () => number }): string;
}

interface FakerLike {
  person: {
    firstName: () => string;
    lastName: () => string;
  };
}

function pick<T>(items: readonly T[], rng: () => number): T {
  const idx = Math.floor(rng() * items.length);
  return items[Math.max(0, Math.min(items.length - 1, idx))] as T;
}

/**
 * Name provider backed by the in-repo curated dataset.
 */
export class StaticDatasetNameProvider implements NameProvider {
  firstName(options: { rng?: () => number } = {}): string {
    const rng = options.rng ?? Math.random;
    return pick(COMMON_FIRST_NAMES, rng);
  }

  lastName(options: { rng?: () => number } = {}): string {
    const rng = options.rng ?? Math.random;
    return pick(COMMON_LAST_NAMES, rng);
  }
}

/**
 * Name provider backed by `@faker-js/faker`.
 *
 * Useful for large-scale synthetic name generation without maintaining
 * in-repo name lists.
 */
export class FakerNameProvider implements NameProvider {
  private readonly faker: FakerLike;

  constructor(options: { faker?: FakerLike } = {}) {
    this.faker = options.faker ?? defaultFaker;
  }

  firstName(): string {
    return this.faker.person.firstName();
  }

  lastName(): string {
    return this.faker.person.lastName();
  }
}

export const DEFAULT_NAME_PROVIDER = new StaticDatasetNameProvider();
