export {
  generateFirstName,
  generateLastName,
  generateFullName,
  generateUniqueFirstName,
  generateUniqueLastName,
  generateUniqueFullName,
  type NameGenerationOptions,
  type UniqueNameOptions,
} from "./nameGenerator.js";

export {
  InMemoryUniqueValueStore,
  clearScopedInMemoryStores,
  getScopedInMemoryStore,
  type UniqueValueStore,
} from "./uniqueStore.js";

export {
  DEFAULT_NAME_PROVIDER,
  FakerNameProvider,
  StaticDatasetNameProvider,
  type NameProvider,
} from "./providers.js";
