import { getScopedInMemoryStore, type UniqueValueStore } from "./uniqueStore.js";
import { DEFAULT_NAME_PROVIDER, type NameProvider } from "./providers.js";

export interface NameGenerationOptions {
  /** Inject deterministic random source for tests. Default: Math.random. */
  rng?: () => number;
  /** Override name source (dataset/faker/custom). */
  provider?: NameProvider;
}

export interface UniqueNameOptions extends NameGenerationOptions {
  /** Scope for in-memory uniqueness when no custom store is provided. */
  scope?: string;
  /** Custom persistence layer for cross-process uniqueness. */
  store?: UniqueValueStore;
  /** Maximum attempts to find an unused value. Default: 1000. */
  maxAttempts?: number;
  /** Normalize value before checking uniqueness. Default: lowercase trim. */
  normalize?: (value: string) => string;
}

function defaultNormalize(value: string): string {
  return value.trim().toLowerCase();
}

async function generateUnique(
  producer: () => string,
  options: UniqueNameOptions
): Promise<string> {
  const maxAttempts = options.maxAttempts ?? 1000;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new TypeError("unique name generation: maxAttempts must be an integer >= 1");
  }
  const normalize = options.normalize ?? defaultNormalize;
  const store = options.store ?? getScopedInMemoryStore(options.scope ?? "default");

  for (let i = 0; i < maxAttempts; i++) {
    const candidate = producer();
    const key = normalize(candidate);
    if (!(await store.has(key))) {
      await store.add(key);
      return candidate;
    }
  }

  throw new Error(
    `Unable to generate a unique value after ${maxAttempts} attempts. ` +
      "Use a larger name pool, custom normalize, or custom store."
  );
}

/**
 * Generate a realistic first name from a curated common-name list.
 *
 * @example
 * ```ts
 * const first = generateFirstName();
 * ```
 */
export function generateFirstName(options: NameGenerationOptions = {}): string {
  const provider = options.provider ?? DEFAULT_NAME_PROVIDER;
  return provider.firstName({ rng: options.rng });
}

/**
 * Generate a realistic last name from a curated common-name list.
 *
 * @example
 * ```ts
 * const last = generateLastName();
 * ```
 */
export function generateLastName(options: NameGenerationOptions = {}): string {
  const provider = options.provider ?? DEFAULT_NAME_PROVIDER;
  return provider.lastName({ rng: options.rng });
}

/**
 * Generate a realistic full name.
 *
 * @example
 * ```ts
 * const fullName = generateFullName();
 * ```
 */
export function generateFullName(options: NameGenerationOptions = {}): string {
  return `${generateFirstName(options)} ${generateLastName(options)}`;
}

/**
 * Generate a unique first name within a scope/store.
 */
export function generateUniqueFirstName(
  options: UniqueNameOptions = {}
): Promise<string> {
  return generateUnique(() => generateFirstName(options), options);
}

/**
 * Generate a unique last name within a scope/store.
 */
export function generateUniqueLastName(options: UniqueNameOptions = {}): Promise<string> {
  return generateUnique(() => generateLastName(options), options);
}

/**
 * Generate a unique full name within a scope/store.
 */
export function generateUniqueFullName(options: UniqueNameOptions = {}): Promise<string> {
  return generateUnique(() => generateFullName(options), options);
}
