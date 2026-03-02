import { AddressProviderError, AddressVerificationError } from "../errors.js";
import type {
  AddressInput,
  AddressProvider,
  PostalCodeLookupRequest,
  SupportedCountryCode,
  ValidatedPostalCodeAddress,
  VerifiedAddress,
} from "../types.js";
import {
  assertProviderSupportsCountry,
  fetchJsonOrThrow,
  normalizeComparable,
} from "./providerUtils.js";

interface ZippopotamResponse {
  "post code": string;
  country: string;
  "country abbreviation": string;
  places: Array<{
    "place name": string;
    state: string;
    "state abbreviation": string;
  }>;
}

export interface ZippopotamAddressProviderOptions {
  endpoint?: string;
}

function canonicalCountryCode(value: SupportedCountryCode): string {
  return value.toLowerCase();
}

function normalizePostalCode(value: string): string {
  const cleaned = value.trim().toUpperCase();
  if (!cleaned) throw new TypeError("postalCode is required");
  return cleaned;
}

export class ZippopotamAddressProvider implements AddressProvider {
  readonly name = "Zippopotam";
  private readonly endpoint: string;

  constructor(options: ZippopotamAddressProviderOptions = {}) {
    this.endpoint = options.endpoint ?? "https://api.zippopotam.us";
  }

  supportsCountry(country: SupportedCountryCode): boolean {
    return country === "US" || country === "CA";
  }

  async lookupPostalCode(
    request: PostalCodeLookupRequest
  ): Promise<ValidatedPostalCodeAddress> {
    const postalCode = normalizePostalCode(request.postalCode);
    assertProviderSupportsCountry({
      providerName: this.name,
      country: request.country,
      supportsCountry: this.supportsCountry.bind(this),
    });
    const country = canonicalCountryCode(request.country);
    const url = `${this.endpoint}/${country}/${encodeURIComponent(postalCode)}`;
    const payload = await fetchJsonOrThrow<ZippopotamResponse>(url, {
      signal: request.signal,
      errorPrefix: `Zippopotam lookup for ${request.country} ${postalCode}`,
    });
    const first = payload.places?.[0];
    if (!first) {
      throw new AddressProviderError("Zippopotam lookup returned no places");
    }

    return {
      country: request.country,
      postalCode: payload["post code"],
      city: first["place name"],
      stateProvince: first["state abbreviation"] || first.state,
      source: this.name,
      uspsVerified: false,
    };
  }

  async verifyAddress(request: AddressInput): Promise<VerifiedAddress> {
    const lookedUp = await this.lookupPostalCode(request);
    if (
      request.city &&
      normalizeComparable(request.city) !== normalizeComparable(lookedUp.city)
    ) {
      throw new AddressVerificationError(
        `City mismatch for postal code ${request.postalCode}: expected ${lookedUp.city}`
      );
    }
    if (
      request.stateProvince &&
      normalizeComparable(request.stateProvince) !==
        normalizeComparable(lookedUp.stateProvince)
    ) {
      throw new AddressVerificationError(
        `State/Province mismatch for postal code ${request.postalCode}: expected ${lookedUp.stateProvince}`
      );
    }

    return {
      ...lookedUp,
      addressLine1: request.addressLine1,
      addressLine2: request.addressLine2,
    };
  }
}
