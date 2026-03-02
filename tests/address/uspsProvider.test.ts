import { afterEach, describe, expect, it, vi } from "vitest";
import { UspsAddressProvider } from "../../src/address/index.js";

describe("UspsAddressProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("looks up city/state by US zip using USPS XML response", async () => {
    const provider = new UspsAddressProvider({
      userId: "TESTUSER",
      endpoint: "https://example.test",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          `<CityStateLookupResponse><ZipCode ID="0"><Zip5>90210</Zip5><City>BEVERLY HILLS</City><State>CA</State></ZipCode></CityStateLookupResponse>`,
      })
    );

    const out = await provider.lookupPostalCode({
      country: "US",
      postalCode: "90210",
    });
    expect(out.postalCode).toBe("90210");
    expect(out.city).toBe("BEVERLY HILLS");
    expect(out.stateProvince).toBe("CA");
    expect(out.uspsVerified).toBe(true);
  });

  it("normalizes verified address from USPS XML response", async () => {
    const provider = new UspsAddressProvider({
      userId: "TESTUSER",
      endpoint: "https://example.test",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          `<AddressValidateResponse><Address><Address2>6406 IVY LN</Address2><Address1>APT 1</Address1><City>GREENBELT</City><State>MD</State><Zip5>20770</Zip5><Zip4>1441</Zip4></Address></AddressValidateResponse>`,
      })
    );

    const out = await provider.verifyAddress({
      country: "US",
      postalCode: "20770",
      addressLine1: "6406 Ivy Ln",
      addressLine2: "Apt 1",
      city: "Greenbelt",
      stateProvince: "MD",
    });
    expect(out.addressLine1).toBe("6406 IVY LN");
    expect(out.addressLine2).toBe("APT 1");
    expect(out.postalCode).toBe("20770-1441");
    expect(out.uspsVerified).toBe(true);
  });

  it("rejects invalid constructor and country", async () => {
    expect(() => new UspsAddressProvider({ userId: "" })).toThrow(/userId/);
    const provider = new UspsAddressProvider({
      userId: "TESTUSER",
      endpoint: "https://example.test",
    });
    await expect(
      provider.lookupPostalCode({ country: "CA", postalCode: "K1A 0B1" })
    ).rejects.toThrow(/does not support country/);
    await expect(
      provider.verifyAddress({
        country: "CA",
        postalCode: "90210",
        addressLine1: "1 Main St",
      })
    ).rejects.toThrow(/does not support country/);
  });

  it("handles USPS error and incomplete responses", async () => {
    const provider = new UspsAddressProvider({
      userId: "TESTUSER",
      endpoint: "https://example.test",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          `<CityStateLookupResponse><Error><Description>Invalid ZIP</Description></Error></CityStateLookupResponse>`,
      })
    );
    await expect(
      provider.lookupPostalCode({ country: "US", postalCode: "90210" })
    ).rejects.toThrow(/CityStateLookup failed/);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          `<CityStateLookupResponse><ZipCode ID="0"><Zip5>90210</Zip5></ZipCode></CityStateLookupResponse>`,
      })
    );
    await expect(
      provider.lookupPostalCode({ country: "US", postalCode: "90210" })
    ).rejects.toThrow(/incomplete response/);
  });

  it("handles verify errors and bad request status", async () => {
    const provider = new UspsAddressProvider({
      userId: "TESTUSER",
      endpoint: "https://example.test",
    });

    await expect(
      provider.verifyAddress({
        country: "US",
        postalCode: "20770",
      })
    ).rejects.toThrow(/addressLine1/);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "",
      })
    );
    await expect(
      provider.lookupPostalCode({ country: "US", postalCode: "90210" })
    ).rejects.toThrow(/status 500/);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          `<AddressValidateResponse><Error><Description>Bad address</Description></Error></AddressValidateResponse>`,
      })
    );
    await expect(
      provider.verifyAddress({
        country: "US",
        postalCode: "20770",
        addressLine1: "bad",
      })
    ).rejects.toThrow(/Verify failed/);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          `<AddressValidateResponse><Address><Address2>6406 IVY LN</Address2></Address></AddressValidateResponse>`,
      })
    );
    await expect(
      provider.verifyAddress({
        country: "US",
        postalCode: "20770",
        addressLine1: "6406 Ivy Ln",
      })
    ).rejects.toThrow(/incomplete response/);
  });
});
