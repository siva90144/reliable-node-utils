import { describe, expect, it } from "vitest";
import {
  ProviderNotFoundError,
  getValidAddressByPostalCode,
  verifyAddress,
  type AddressProvider,
} from "../../src/address/index.js";

describe("address service", () => {
  it("requires USPS provider for US by default", async () => {
    const provider: AddressProvider = {
      name: "Zippopotam",
      supportsCountry: (country) => country === "US" || country === "CA",
      lookupPostalCode: async () => ({
        country: "US",
        postalCode: "90210",
        city: "Beverly Hills",
        stateProvince: "CA",
        source: "Zippopotam",
        uspsVerified: false,
      }),
      verifyAddress: async () => {
        throw new Error("Not implemented for this test");
      },
    };
    await expect(
      getValidAddressByPostalCode({
        country: "US",
        postalCode: "90210",
        providers: [provider],
      })
    ).rejects.toThrow(ProviderNotFoundError);
  });

  it("can allow non-USPS fallback for US when configured", async () => {
    const provider: AddressProvider = {
      name: "Zippopotam",
      supportsCountry: (country) => country === "US" || country === "CA",
      lookupPostalCode: async () => ({
        country: "US" as const,
        postalCode: "90210",
        city: "Beverly Hills",
        stateProvince: "CA",
        source: "Zippopotam",
        uspsVerified: false,
      }),
      verifyAddress: async () => {
        throw new Error("Not implemented for this test");
      },
    };
    const out = await getValidAddressByPostalCode({
      country: "US",
      postalCode: "90210",
      providers: [provider],
      requireUspsForUS: false,
    });
    expect(out.city).toBe("Beverly Hills");
  });

  it("selects USPS for US when available", async () => {
    const usps: AddressProvider = {
      name: "USPS",
      supportsCountry: (country) => country === "US",
      lookupPostalCode: async () => ({
        country: "US" as const,
        postalCode: "10001",
        city: "NEW YORK",
        stateProvince: "NY",
        source: "USPS",
        uspsVerified: true,
      }),
      verifyAddress: async () => {
        throw new Error("Not implemented for this test");
      },
    };
    const fallback: AddressProvider = {
      name: "Zippopotam",
      supportsCountry: (country) => country === "US" || country === "CA",
      lookupPostalCode: async () => ({
        country: "US",
        postalCode: "10001",
        city: "New York",
        stateProvince: "NY",
        source: "Zippopotam",
        uspsVerified: false,
      }),
      verifyAddress: async () => {
        throw new Error("Not implemented for this test");
      },
    };
    const out = await getValidAddressByPostalCode({
      country: "US",
      postalCode: "10001",
      providers: [usps, fallback],
    });
    expect(out.source).toBe("USPS");
    expect(out.uspsVerified).toBe(true);
  });

  it("verifies address with provider selection", async () => {
    const provider: AddressProvider = {
      name: "Zippopotam",
      supportsCountry: (country) => country === "CA",
      lookupPostalCode: async () => ({
        country: "CA",
        postalCode: "K1A 0B1",
        city: "Ottawa",
        stateProvince: "ON",
        source: "Zippopotam",
        uspsVerified: false,
      }),
      verifyAddress: async (address) => ({
        country: "CA",
        postalCode: "K1A 0B1",
        city: "Ottawa",
        stateProvince: "ON",
        addressLine1: address.addressLine1,
        source: "Zippopotam",
        uspsVerified: false,
      }),
    };
    const out = await verifyAddress({
      address: {
        country: "CA",
        postalCode: "K1A 0B1",
        addressLine1: "111 Wellington St",
      },
      providers: [provider],
    });
    expect(out.city).toBe("Ottawa");
  });

  it("throws when no provider supports country", async () => {
    const usProvider: AddressProvider = {
      name: "USOnly",
      supportsCountry: (country) => country === "US",
      lookupPostalCode: async () => ({
        country: "US",
        postalCode: "10001",
        city: "New York",
        stateProvince: "NY",
        source: "USOnly",
        uspsVerified: false,
      }),
      verifyAddress: async () => ({
        country: "US",
        postalCode: "10001",
        city: "New York",
        stateProvince: "NY",
        source: "USOnly",
        uspsVerified: false,
      }),
    };
    await expect(
      verifyAddress({
        address: {
          country: "CA",
          postalCode: "K1A 0B1",
        },
        providers: [usProvider],
        requireUspsForUS: false,
      })
    ).rejects.toThrow(ProviderNotFoundError);
  });
});
