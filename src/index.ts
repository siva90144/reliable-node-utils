/**
 * reliable-node-utils
 *
 * Resume-grade Node.js utilities: retry, timeout, concurrency, memoize,
 * deepMerge, and runtime guards. ESM + CJS, TypeScript-first.
 *
 * @packageDocumentation
 */

export { retry, type RetryOptions } from "./async/index.js";
export { withTimeout, type WithTimeoutOptions } from "./async/index.js";
export { pLimit } from "./async/index.js";

export { memoize, type MemoizeOptions } from "./fn/index.js";

export { deepMerge } from "./object/index.js";

export { isDefined, isNonEmptyString, isPlainObject } from "./guards/index.js";

export {
  replaceTemplateValues,
  splitString,
  parseBooleanString,
  isNullOrEmptyString,
  snakeToPascalCase,
  convertToCamelCase,
  formatStringValue,
} from "./string/index.js";

export {
  generateRandomAlphanumericString,
  generateRandomNDigitNumber,
  generateRandomAlphabeticString,
  getAlphaNumericString,
  generateRandomNumber,
  generateRandomString,
} from "./random/index.js";

export { updateJsonValues, updateJsonData } from "./json/index.js";

export {
  getRelativeDate,
  getDate,
  getCurrentTimeInTimeZone,
  isValidTimeZone,
  getCurrentTimeInEst,
  printCurrentTimeInEST,
  EST_TIME_ZONE,
  type RelativeDateToken,
} from "./date/index.js";

export { renameMapKey, updateKey } from "./collections/index.js";

export {
  generateFirstName,
  generateLastName,
  generateFullName,
  generateUniqueFirstName,
  generateUniqueLastName,
  generateUniqueFullName,
  InMemoryUniqueValueStore,
  StaticDatasetNameProvider,
  FakerNameProvider,
  DEFAULT_NAME_PROVIDER,
  getScopedInMemoryStore,
  clearScopedInMemoryStores,
  type NameGenerationOptions,
  type UniqueNameOptions,
  type NameProvider,
  type UniqueValueStore,
} from "./identity/index.js";

export {
  getValidAddressByPostalCode,
  verifyAddress,
  AddressProviderError,
  AddressVerificationError,
  ProviderNotFoundError,
  UspsAddressProvider,
  ZippopotamAddressProvider,
  CanadaPostAddressProvider,
  type GetValidAddressByPostalCodeOptions,
  type VerifyAddressOptions,
  type SupportedCountryCode,
  type PostalCodeLookupRequest,
  type AddressInput,
  type ValidatedPostalCodeAddress,
  type VerifiedAddress,
  type AddressProvider,
  type UspsAddressProviderOptions,
  type ZippopotamAddressProviderOptions,
  type CanadaPostAddressProviderOptions,
} from "./address/index.js";

export { AbortError, TimeoutError, RetryExhaustedError } from "./errors.js";
