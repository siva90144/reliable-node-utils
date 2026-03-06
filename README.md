# reliable-node-utils

Reliable, type-safe utilities for Node.js and TypeScript:

- `retry` with exponential backoff, jitter, hooks, and `AbortSignal`
- `withTimeout` for promise/function timeboxing with abort support
- `pLimit` for concurrency control
- `memoize` with TTL, max size, and custom keying
- `deepMerge` for safe recursive object merging
- Runtime guards: `isDefined`, `isNonEmptyString`, `isPlainObject`
- Realistic name generators with uniqueness helpers
- Postal-code/address utilities with USPS-first US verification

Built in strict TypeScript and published as both **ESM + CJS** with bundled `.d.ts` types.

## Table of Contents

- [Why this package](#why-this-package)
- [Install](#install)
- [Quick start](#quick-start)
- [Compatibility](#compatibility)
- [API reference](#api-reference)
  - [`retry(fn, options?)`](#retryfn-options)
  - [`withTimeout(promiseOrFn, ms, options?)`](#withtimeoutpromiseorfn-ms-options)
  - [`pLimit(concurrency)`](#plimitconcurrency)
  - [`memoize(fn, options?)`](#memoizefn-options)
  - [`deepMerge(a, b)`](#deepmergea-b)
  - [Guards](#guards)
  - [Error classes](#error-classes)
- [Utility domains](#utility-domains)
- [Behavior notes and tradeoffs](#behavior-notes-and-tradeoffs)
- [Identity and address utilities](#identity-and-address-utilities)
- [Versioning and deprecation](#versioning-and-deprecation)
- [Maintainer release guide](#maintainer-release-guide)
- [Scripts](#scripts)
- [License](#license)

## Why this package

- **Production-focused defaults** with explicit runtime validation
- **Works everywhere in Node projects** (`import` and `require`)
- **Tree-shake friendly** (named exports only, `sideEffects: false`)
- **Strong tests and coverage thresholds** for confidence

## Install

```bash
npm install reliable-node-utils
```

## Before you start (address utilities)

Address lookup/verification requires provider credentials:

- US: set `USPS_USER_ID` and use `UspsAddressProvider`
- Canada: set `CANADA_POST_KEY` and use `CanadaPostAddressProvider`

Without configured providers/keys, address methods cannot verify real addresses.

## Quick start

### Most common picks

- API calls: `retry` + `withTimeout`
- Concurrency: `pLimit`
- Derived caching: `memoize`
- Test data names: `generateFullName` or `generateUniqueFullName`
- Real address validation: `getValidAddressByPostalCode` / `verifyAddress` with provider keys

### TypeScript (ESM)

```ts
import {
  retry,
  withTimeout,
  pLimit,
  memoize,
  deepMerge,
  isDefined,
} from "reliable-node-utils";

const limit = pLimit(2);

const fetchJson = (url: string) =>
  withTimeout(() => fetch(url).then((r) => r.json()), 5000);

const safeFetch = (url: string) =>
  retry(() => fetchJson(url), { maxAttempts: 3, baseDelayMs: 250 });

const cachedUser = memoize(
  async (id: string) => safeFetch(`/api/users/${id}`),
  { ttlMs: 60_000, keyFn: (id) => id }
);

const merged = deepMerge({ retries: 2, headers: { a: "1" } }, { headers: { b: "2" } });

const arr: Array<string | undefined> = ["a", undefined, "b"];
const clean = arr.filter(isDefined);
```

### JavaScript (CJS)

```js
const { retry, withTimeout, pLimit, memoize, deepMerge } = require("reliable-node-utils");

const limit = pLimit(3);

const get = memoize(
  async (id) => withTimeout(fetch(`/api/${id}`).then((r) => r.json()), 3000),
  { maxSize: 100 }
);

const run = async () =>
  retry(() => limit(() => get("123")), { maxAttempts: 4, baseDelayMs: 200 });
```

## Compatibility

- **Node:** `>=18`
- **Module formats:** ESM and CJS via `exports`
- **Types:** included (`dist/index.d.ts`)
- **Tree-shaking:** named exports + `sideEffects: false`

## API reference

### `retry(fn, options?)`

Retry an async operation with exponential backoff and optional jitter.

```ts
retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>
```

**Options**

- `maxAttempts?: number` (default `3`) - integer `>= 1`
- `baseDelayMs?: number` (default `1000`) - finite number `>= 0`
- `maxDelayMs?: number` (default `30000`) - finite number `>= baseDelayMs`
- `jitter?: boolean` (default `true`) - full jitter in `[0, computedDelay]`
- `onRetry?: (attempt: number, error: unknown) => void | Promise<void>`
- `signal?: AbortSignal`

**Throws**

- `TypeError` - invalid options
- `AbortError` - aborted via signal
- `RetryExhaustedError` - attempts exhausted (`attempt`, `lastError`)

**Example**

```ts
const response = await retry(() => fetch("/api/data"), {
  maxAttempts: 5,
  baseDelayMs: 250,
  maxDelayMs: 4000,
  onRetry: (attempt, err) => {
    console.warn(`attempt ${attempt} failed`, err);
  },
  signal: controller.signal,
});
```

### `withTimeout(promiseOrFn, ms, options?)`

Apply a timeout to a promise or async function.

```ts
withTimeout<T>(
  promiseOrFn: Promise<T> | (() => Promise<T>),
  ms: number,
  options?: { signal?: AbortSignal }
): Promise<T>
```

**Parameters**

- `ms` must be finite and `>= 0`
- If `signal` is already aborted, function rejects immediately

**Throws**

- `TypeError` - invalid `ms`
- `TimeoutError` - timeout exceeded
- `AbortError` - aborted via signal

**Example**

```ts
const data = await withTimeout(
  () => fetch("/api/data").then((r) => r.json()),
  5000,
  { signal: controller.signal }
);
```

### `pLimit(concurrency)`

Limit concurrent async executions.

```ts
pLimit(concurrency: number): <T, A extends unknown[]>(
  fn: (...args: A) => Promise<T>,
  ...args: A
) => Promise<T>
```

**Parameters**

- `concurrency` must be a finite number `>= 1` (throws `TypeError` otherwise)

**Example**

```ts
const limit = pLimit(2);
const results = await Promise.all([
  limit(() => fetch("/a")),
  limit(() => fetch("/b")),
  limit(() => fetch("/c")),
]);
```

### `memoize(fn, options?)`

Memoize function results with optional expiration and LRU-style size cap.

```ts
memoize<F extends (...args: unknown[]) => unknown>(
  fn: F,
  options?: MemoizeOptions<F>
): F
```

**Options**

- `ttlMs?: number` - entry expiration in milliseconds
- `maxSize?: number` - maximum entries (evicts least recently used)
- `keyFn?: (...args) => string` - custom cache key; default `JSON.stringify(args)`

**Notes**

- `undefined` return values are cached correctly
- If `fn` returns a `Promise`, the promise itself is cached

**Example**

```ts
const getUser = memoize(
  async (id: string) => fetch(`/api/users/${id}`).then((r) => r.json()),
  { ttlMs: 60_000, maxSize: 200, keyFn: (id) => id }
);
```

### `deepMerge(a, b)`

Recursively merge plain objects. `b` overrides `a`.

```ts
deepMerge<T extends object, U extends object>(a: T, b: U): T & U
```

**Behavior**

- merges nested plain objects recursively
- replaces arrays and non-plain objects from `b`
- skips `undefined` values from `b`
- does not mutate inputs
- ignores dangerous keys: `__proto__`, `prototype`, `constructor`

**Example**

```ts
const merged = deepMerge(
  { service: { retries: 2, tags: ["a"] } },
  { service: { retries: 3, tags: ["b"] } }
);
// => { service: { retries: 3, tags: ["b"] } }
```

### Guards

- `isDefined<T>(value: T | null | undefined): value is T`
- `isNonEmptyString(value: unknown): value is string`
- `isPlainObject(value: unknown): value is Record<string, unknown>`

**Example**

```ts
const values: Array<string | undefined> = ["a", undefined, "b"];
const defined = values.filter(isDefined); // string[]
```

### Error classes

- `AbortError`
- `TimeoutError`
- `RetryExhaustedError`

These classes are exported for `instanceof` checks.

## Identity and address utilities

### Names

- `generateFirstName()`
- `generateLastName()`
- `generateFullName()`
- `generateUniqueFirstName(options?)`
- `generateUniqueLastName(options?)`
- `generateUniqueFullName(options?)`
- Providers: `StaticDatasetNameProvider` (default), `FakerNameProvider`, custom `NameProvider`

```ts
import {
  generateUniqueFullName,
  InMemoryUniqueValueStore,
} from "reliable-node-utils";

const store = new InMemoryUniqueValueStore();
const fullName = await generateUniqueFullName({ store });
```

```ts
import { FakerNameProvider, generateFullName } from "reliable-node-utils";

const provider = new FakerNameProvider();
const fullName = generateFullName({ provider });
```

### Address utilities

- `getValidAddressByPostalCode(options)`
- `verifyAddress(options)`
- Providers: `UspsAddressProvider`, `CanadaPostAddressProvider`, `ZippopotamAddressProvider`

```ts
import {
  UspsAddressProvider,
  CanadaPostAddressProvider,
  ZippopotamAddressProvider,
  getValidAddressByPostalCode,
} from "reliable-node-utils";

const providers = [
  new UspsAddressProvider({ userId: process.env.USPS_USER_ID! }),
  new CanadaPostAddressProvider({ key: process.env.CANADA_POST_KEY! }),
  new ZippopotamAddressProvider(),
];

const us = await getValidAddressByPostalCode({
  country: "US",
  postalCode: "10001",
  providers,
});
```

### USPS and Canada note

USPS validates **US** addresses only.  
For Canada, use `CanadaPostAddressProvider` for official Canada Post-backed
validation. `ZippopotamAddressProvider` remains useful as a lightweight fallback
for postal-code consistency checks.

### Environment variables example

```bash
export USPS_USER_ID="your-usps-user-id"
export CANADA_POST_KEY="your-canadapost-key"
```

## Utility domains

### String

| Function | Purpose |
| --- | --- |
| `replaceTemplateValues` | Replace `{key}` tokens with quoted replacement values |
| `splitString` | Split input by delimiter |
| `parseBooleanString` | Strict parse of `"true"`/`"false"` |
| `isNullOrEmptyString` | Null/undefined/empty-after-trim check |
| `snakeToPascalCase` | Convert `snake_case` to `PascalCase` |

Legacy aliases:

- `formatStringValue` -> `replaceTemplateValues`
- `convertToCamelCase` -> `snakeToPascalCase` (legacy name retained; output is PascalCase)

### Random

| Function | Purpose |
| --- | --- |
| `generateRandomAlphanumericString` | Random alphanumeric string |
| `generateRandomNDigitNumber` | Random number with exact digit length |
| `generateRandomAlphabeticString` | Random letters-only string |

Legacy aliases: `getAlphaNumericString`, `generateRandomNumber`, `generateRandomString`.

### JSON

| Function | Purpose |
| --- | --- |
| `updateJsonValues` | Recursively update matching keys in JSON text |

Legacy alias: `updateJsonData`.

### Date

| Function | Purpose |
| --- | --- |
| `getRelativeDate` | Format Today / Yesterday / Year(-1) with pattern |
| `getCurrentTimeInTimeZone` | Format current time as `HH:mm:ss` for any IANA timezone |
| `isValidTimeZone` | Validate IANA timezone support in current runtime |
| `getCurrentTimeInEst` | Convenience helper for `America/New_York` |

Legacy aliases: `getDate`, `printCurrentTimeInEST`.

```ts
import {
  getDate,
  getCurrentTimeInTimeZone,
  getCurrentTimeInEst,
  isValidTimeZone,
} from "reliable-node-utils";

// Relative date formatting
const today = getDate("Today", "yyyy-MM-dd"); // e.g. 2026-03-06

// Any IANA timezone
const utcTime = getCurrentTimeInTimeZone("UTC"); // e.g. 15:04:05
const indiaTime = getCurrentTimeInTimeZone("Asia/Kolkata"); // e.g. 20:34:05

// Validate timezone before formatting
const zone = "America/New_York";
const safeTime = isValidTimeZone(zone) ? getCurrentTimeInTimeZone(zone) : "invalid-timezone";

// EST convenience helper (America/New_York)
const estTime = getCurrentTimeInEst(); // e.g. 10:04:05
```

```js
const {
  getCurrentTimeInTimeZone,
  getCurrentTimeInEst,
  isValidTimeZone,
} = require("reliable-node-utils");

const zone = "Europe/London";
const time = isValidTimeZone(zone)
  ? getCurrentTimeInTimeZone(zone)
  : "invalid-timezone";

console.log("London:", time);
console.log("Eastern:", getCurrentTimeInEst());
```

### Collections

| Function | Purpose |
| --- | --- |
| `renameMapKey` | Rename key in `Map<string, string>` and strip wrapping quotes |

Legacy alias: `updateKey`.

## Behavior notes and tradeoffs

- `retry` uses **full jitter** when `jitter: true`, which helps reduce synchronized retries.
- `withTimeout` cannot cancel the underlying operation by itself; it only rejects the wrapper promise.
  Use your own `AbortController` in underlying APIs (like `fetch`) when cancellation is needed.
- `memoize` default keying uses `JSON.stringify(args)`; for complex or non-serializable args, provide `keyFn`.
- `deepMerge` is intentionally conservative and only deeply merges plain objects.

## Versioning and deprecation

- **Versioning:** [SemVer](https://semver.org/)
- **Deprecation policy:** APIs are marked deprecated in docs/JSDoc before removal in the next major release.

## Maintainer release guide

1. `npm ci`
2. Add a changeset: `npx changeset`
3. Commit and open PR
4. After merge to `main`, release workflow runs version/publish
5. Ensure `NPM_TOKEN` is configured in repo secrets

Local release command:

```bash
npm run release
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run build` | Build ESM + CJS + types |
| `npm run dev` | Watch mode build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with autofix |
| `npm run format` | Run Prettier write |
| `npm run format:check` | Run Prettier check |
| `npm run typecheck` | Run `tsc --noEmit` |
| `npm run test` | Run Vitest |
| `npm run test:coverage` | Run tests with coverage |

## License

Apache-2.0
