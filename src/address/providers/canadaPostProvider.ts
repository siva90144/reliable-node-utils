import { isNonEmptyString } from "../../guards/index.js";
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
  normalizePostalComparable,
} from "./providerUtils.js";

interface CanadaPostFindItem {
  Id?: string;
  Text?: string;
  Description?: string;
}

interface CanadaPostFindResponse {
  Items?: CanadaPostFindItem[];
}

interface CanadaPostRetrieveItem {
  Line1?: string;
  Line2?: string;
  City?: string;
  ProvinceCode?: string;
  PostalCode?: string;
}

interface CanadaPostRetrieveResponse {
  Items?: CanadaPostRetrieveItem[];
}

export interface CanadaPostAddressProviderOptions {
  key: string;
  findEndpoint?: string;
  retrieveEndpoint?: string;
}

function normalizeCanadianPostalCode(value: string): string {
  const cleaned = value.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleaned)) {
    throw new TypeError(
      "CanadaPost provider: postalCode must be a valid Canadian postal code (A1A1A1)"
    );
  }
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
}

export class CanadaPostAddressProvider implements AddressProvider {
  readonly name = "CanadaPost";
  private readonly key: string;
  private readonly findEndpoint: string;
  private readonly retrieveEndpoint: string;

  constructor(options: CanadaPostAddressProviderOptions) {
    if (!isNonEmptyString(options.key)) {
      throw new TypeError("CanadaPost provider: key is required");
    }
    this.key = options.key;
    this.findEndpoint =
      options.findEndpoint ??
      "https://ws1.postescanada-canadapost.ca/AddressComplete/Interactive/Find/v2.10/json3.ws";
    this.retrieveEndpoint =
      options.retrieveEndpoint ??
      "https://ws1.postescanada-canadapost.ca/AddressComplete/Interactive/Retrieve/v2.11/json3.ws";
  }

  supportsCountry(country: SupportedCountryCode): boolean {
    return country === "CA";
  }

  async lookupPostalCode(
    request: PostalCodeLookupRequest
  ): Promise<ValidatedPostalCodeAddress> {
    assertProviderSupportsCountry({
      providerName: this.name,
      country: request.country,
      supportsCountry: this.supportsCountry.bind(this),
    });

    const postalCode = normalizeCanadianPostalCode(request.postalCode);
    const retrieved = await this.findAndRetrieve({
      searchTerm: postalCode,
      signal: request.signal,
    });

    if (!retrieved.city || !retrieved.provinceCode || !retrieved.postalCode) {
      throw new AddressProviderError("CanadaPost lookup returned incomplete response");
    }

    return {
      country: "CA",
      postalCode: normalizeCanadianPostalCode(retrieved.postalCode),
      city: retrieved.city,
      stateProvince: retrieved.provinceCode,
      source: this.name,
      uspsVerified: false,
    };
  }

  async verifyAddress(request: AddressInput): Promise<VerifiedAddress> {
    assertProviderSupportsCountry({
      providerName: this.name,
      country: request.country,
      supportsCountry: this.supportsCountry.bind(this),
    });
    if (!isNonEmptyString(request.addressLine1)) {
      throw new TypeError(
        "CanadaPost provider: addressLine1 is required for verification"
      );
    }

    const searchPostal = normalizeCanadianPostalCode(request.postalCode);
    const searchTerm = [request.addressLine1, request.city, searchPostal]
      .filter(isNonEmptyString)
      .join(" ");
    const retrieved = await this.findAndRetrieve({
      searchTerm,
      signal: request.signal,
    });

    if (
      !retrieved.line1 ||
      !retrieved.city ||
      !retrieved.provinceCode ||
      !retrieved.postalCode
    ) {
      throw new AddressVerificationError(
        "CanadaPost verify returned incomplete response"
      );
    }

    if (
      normalizePostalComparable(retrieved.postalCode) !==
      normalizePostalComparable(searchPostal)
    ) {
      throw new AddressVerificationError(
        `Postal code mismatch: expected ${searchPostal}, got ${retrieved.postalCode}`
      );
    }
    if (
      request.city &&
      normalizeComparable(request.city) !== normalizeComparable(retrieved.city)
    ) {
      throw new AddressVerificationError(
        `City mismatch: expected ${request.city}, got ${retrieved.city}`
      );
    }
    if (
      request.stateProvince &&
      normalizeComparable(request.stateProvince) !==
        normalizeComparable(retrieved.provinceCode)
    ) {
      throw new AddressVerificationError(
        `Province mismatch: expected ${request.stateProvince}, got ${retrieved.provinceCode}`
      );
    }

    return {
      country: "CA",
      postalCode: normalizeCanadianPostalCode(retrieved.postalCode),
      city: retrieved.city,
      stateProvince: retrieved.provinceCode,
      addressLine1: retrieved.line1,
      addressLine2: retrieved.line2,
      source: this.name,
      uspsVerified: false,
    };
  }

  private async findAndRetrieve(args: {
    searchTerm: string;
    signal?: AbortSignal;
  }): Promise<{
    line1?: string;
    line2?: string;
    city?: string;
    provinceCode?: string;
    postalCode?: string;
  }> {
    const findPayload = await this.callFind(args.searchTerm, args.signal);
    const firstId = findPayload.Items?.find((item) => isNonEmptyString(item.Id))?.Id;
    if (!firstId) {
      throw new AddressProviderError("CanadaPost find returned no candidate addresses");
    }
    const retrieved = await this.callRetrieve(firstId, args.signal);
    const first = retrieved.Items?.[0];
    if (!first) {
      throw new AddressProviderError("CanadaPost retrieve returned no addresses");
    }
    return {
      line1: first.Line1,
      line2: first.Line2,
      city: first.City,
      provinceCode: first.ProvinceCode,
      postalCode: first.PostalCode,
    };
  }

  private async callFind(
    searchTerm: string,
    signal?: AbortSignal
  ): Promise<CanadaPostFindResponse> {
    const params = new URLSearchParams({
      Key: this.key,
      SearchTerm: searchTerm,
      Country: "CAN",
      Limit: "5",
    });
    const url = `${this.findEndpoint}?${params.toString()}`;
    return await fetchJsonOrThrow<CanadaPostFindResponse>(url, {
      signal,
      errorPrefix: "CanadaPost find",
    });
  }

  private async callRetrieve(
    id: string,
    signal?: AbortSignal
  ): Promise<CanadaPostRetrieveResponse> {
    const params = new URLSearchParams({
      Key: this.key,
      Id: id,
      Country: "CAN",
    });
    const url = `${this.retrieveEndpoint}?${params.toString()}`;
    return await fetchJsonOrThrow<CanadaPostRetrieveResponse>(url, {
      signal,
      errorPrefix: "CanadaPost retrieve",
    });
  }
}
