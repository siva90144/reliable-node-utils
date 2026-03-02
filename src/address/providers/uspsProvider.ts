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
import { assertProviderSupportsCountry, fetchTextOrThrow } from "./providerUtils.js";

export interface UspsAddressProviderOptions {
  userId: string;
  endpoint?: string;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function getTagValue(xml: string, tag: string): string | undefined {
  const match = new RegExp(`<${tag}>([^<]*)</${tag}>`, "i").exec(xml);
  return match?.[1]?.trim();
}

function normalizeUsZip(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 5);
  if (digits.length !== 5) {
    throw new TypeError("USPS provider: postalCode must contain at least 5 digits");
  }
  return digits;
}

export class UspsAddressProvider implements AddressProvider {
  readonly name = "USPS";
  private readonly endpoint: string;
  private readonly userId: string;

  constructor(options: UspsAddressProviderOptions) {
    if (!isNonEmptyString(options.userId)) {
      throw new TypeError("USPS provider: userId is required");
    }
    this.userId = options.userId;
    this.endpoint = options.endpoint ?? "https://secure.shippingapis.com/ShippingAPI.dll";
  }

  supportsCountry(country: SupportedCountryCode): boolean {
    return country === "US";
  }

  async lookupPostalCode(
    request: PostalCodeLookupRequest
  ): Promise<ValidatedPostalCodeAddress> {
    assertProviderSupportsCountry({
      providerName: this.name,
      country: request.country,
      supportsCountry: this.supportsCountry.bind(this),
    });
    const zip5 = normalizeUsZip(request.postalCode);
    const xml = `<CityStateLookupRequest USERID="${escapeXml(this.userId)}"><ZipCode ID="0"><Zip5>${zip5}</Zip5></ZipCode></CityStateLookupRequest>`;
    const responseXml = await this.callApi("CityStateLookup", xml, request.signal);

    const errorDescription = getTagValue(responseXml, "Description");
    if (errorDescription) {
      throw new AddressProviderError(`USPS CityStateLookup failed: ${errorDescription}`);
    }

    const city = getTagValue(responseXml, "City");
    const state = getTagValue(responseXml, "State");
    const canonicalZip = getTagValue(responseXml, "Zip5") ?? zip5;
    if (!city || !state) {
      throw new AddressProviderError("USPS CityStateLookup returned incomplete response");
    }

    return {
      country: "US",
      postalCode: canonicalZip,
      city,
      stateProvince: state,
      source: this.name,
      uspsVerified: true,
    };
  }

  async verifyAddress(request: AddressInput): Promise<VerifiedAddress> {
    assertProviderSupportsCountry({
      providerName: this.name,
      country: request.country,
      supportsCountry: this.supportsCountry.bind(this),
    });
    if (!isNonEmptyString(request.addressLine1)) {
      throw new TypeError("USPS provider: addressLine1 is required for verification");
    }

    const zip5 = normalizeUsZip(request.postalCode);
    const xml = `<AddressValidateRequest USERID="${escapeXml(this.userId)}"><Address ID="0"><FirmName></FirmName><Address1>${escapeXml(request.addressLine2 ?? "")}</Address1><Address2>${escapeXml(request.addressLine1)}</Address2><City>${escapeXml(request.city ?? "")}</City><State>${escapeXml(request.stateProvince ?? "")}</State><Zip5>${zip5}</Zip5><Zip4></Zip4></Address></AddressValidateRequest>`;
    const responseXml = await this.callApi("Verify", xml, request.signal);

    const errorDescription = getTagValue(responseXml, "Description");
    if (errorDescription) {
      throw new AddressVerificationError(`USPS Verify failed: ${errorDescription}`);
    }

    const line1 = getTagValue(responseXml, "Address2");
    const line2 = getTagValue(responseXml, "Address1");
    const city = getTagValue(responseXml, "City");
    const state = getTagValue(responseXml, "State");
    const canonicalZip = getTagValue(responseXml, "Zip5");
    const zip4 = getTagValue(responseXml, "Zip4");

    if (!line1 || !city || !state || !canonicalZip) {
      throw new AddressVerificationError("USPS Verify returned incomplete response");
    }

    return {
      country: "US",
      postalCode: zip4 ? `${canonicalZip}-${zip4}` : canonicalZip,
      city,
      stateProvince: state,
      addressLine1: line1,
      addressLine2: line2 || undefined,
      source: this.name,
      uspsVerified: true,
    };
  }

  private async callApi(api: string, xml: string, signal?: AbortSignal): Promise<string> {
    const url = `${this.endpoint}?API=${encodeURIComponent(api)}&XML=${encodeURIComponent(xml)}`;
    return await fetchTextOrThrow(url, {
      signal,
      errorPrefix: "USPS request",
    });
  }
}
