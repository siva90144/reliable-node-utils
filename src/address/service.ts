import { ProviderNotFoundError } from "./errors.js";
import type {
  AddressInput,
  AddressProvider,
  SupportedCountryCode,
  ValidatedPostalCodeAddress,
  VerifiedAddress,
} from "./types.js";

export interface GetValidAddressByPostalCodeOptions {
  country: SupportedCountryCode;
  postalCode: string;
  providers: AddressProvider[];
  signal?: AbortSignal;
  /**
   * When true, US lookups must use the USPS provider.
   * Default: true
   */
  requireUspsForUS?: boolean;
}

export interface VerifyAddressOptions {
  address: AddressInput;
  providers: AddressProvider[];
  /**
   * When true, US verification must use the USPS provider.
   * Default: true
   */
  requireUspsForUS?: boolean;
}

function pickProvider(
  providers: AddressProvider[],
  country: SupportedCountryCode,
  requireUspsForUS: boolean
): AddressProvider {
  if (country === "US" && requireUspsForUS) {
    const usps = providers.find(
      (provider) => provider.supportsCountry("US") && provider.name === "USPS"
    );
    if (!usps) {
      throw new ProviderNotFoundError(
        "US lookup requires USPS provider, but none was configured"
      );
    }
    return usps;
  }

  const provider = providers.find((p) => p.supportsCountry(country));
  if (!provider) {
    throw new ProviderNotFoundError(
      `No address provider configured for country ${country}`
    );
  }
  return provider;
}

/**
 * Resolve a valid city/state-province for a postal code.
 * For US, this can be configured to strictly require USPS.
 */
export async function getValidAddressByPostalCode(
  options: GetValidAddressByPostalCodeOptions
): Promise<ValidatedPostalCodeAddress> {
  const provider = pickProvider(
    options.providers,
    options.country,
    options.requireUspsForUS ?? true
  );
  return await provider.lookupPostalCode({
    country: options.country,
    postalCode: options.postalCode,
    signal: options.signal,
  });
}

/**
 * Verify and normalize an address with the best provider for its country.
 * For US, this can be configured to strictly require USPS.
 */
export async function verifyAddress(
  options: VerifyAddressOptions
): Promise<VerifiedAddress> {
  const provider = pickProvider(
    options.providers,
    options.address.country,
    options.requireUspsForUS ?? true
  );
  return await provider.verifyAddress(options.address);
}
