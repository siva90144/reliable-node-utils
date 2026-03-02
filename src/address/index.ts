export {
  getValidAddressByPostalCode,
  verifyAddress,
  type GetValidAddressByPostalCodeOptions,
  type VerifyAddressOptions,
} from "./service.js";

export {
  AddressProviderError,
  AddressVerificationError,
  ProviderNotFoundError,
} from "./errors.js";

export {
  type SupportedCountryCode,
  type PostalCodeLookupRequest,
  type AddressInput,
  type ValidatedPostalCodeAddress,
  type VerifiedAddress,
  type AddressProvider,
} from "./types.js";

export {
  UspsAddressProvider,
  type UspsAddressProviderOptions,
} from "./providers/uspsProvider.js";

export {
  ZippopotamAddressProvider,
  type ZippopotamAddressProviderOptions,
} from "./providers/zippopotamProvider.js";

export {
  CanadaPostAddressProvider,
  type CanadaPostAddressProviderOptions,
} from "./providers/canadaPostProvider.js";
