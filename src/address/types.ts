export type SupportedCountryCode = "US" | "CA";

export interface PostalCodeLookupRequest {
  country: SupportedCountryCode;
  postalCode: string;
  signal?: AbortSignal;
}

export interface AddressInput {
  country: SupportedCountryCode;
  postalCode: string;
  city?: string;
  stateProvince?: string;
  addressLine1?: string;
  addressLine2?: string;
  signal?: AbortSignal;
}

export interface ValidatedPostalCodeAddress {
  country: SupportedCountryCode;
  postalCode: string;
  city: string;
  stateProvince: string;
  source: string;
  uspsVerified: boolean;
}

export interface VerifiedAddress {
  country: SupportedCountryCode;
  postalCode: string;
  city: string;
  stateProvince: string;
  addressLine1?: string;
  addressLine2?: string;
  source: string;
  uspsVerified: boolean;
}

export interface AddressProvider {
  readonly name: string;
  supportsCountry(country: SupportedCountryCode): boolean;
  lookupPostalCode(request: PostalCodeLookupRequest): Promise<ValidatedPostalCodeAddress>;
  verifyAddress(request: AddressInput): Promise<VerifiedAddress>;
}
