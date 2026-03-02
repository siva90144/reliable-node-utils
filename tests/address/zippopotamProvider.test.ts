import { afterEach, describe, expect, it, vi } from "vitest";
import { ZippopotamAddressProvider } from "../../src/address/index.js";

describe("ZippopotamAddressProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("looks up a US postal code", async () => {
    const provider = new ZippopotamAddressProvider({
      endpoint: "https://example.test",
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        "post code": "90210",
        country: "United States",
        "country abbreviation": "US",
        places: [
          {
            "place name": "Beverly Hills",
            state: "California",
            "state abbreviation": "CA",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const out = await provider.lookupPostalCode({
      country: "US",
      postalCode: "90210",
    });
    expect(out.city).toBe("Beverly Hills");
    expect(out.stateProvince).toBe("CA");
    expect(out.uspsVerified).toBe(false);
  });

  it("verifies CA address by postal-code consistency", async () => {
    const provider = new ZippopotamAddressProvider({
      endpoint: "https://example.test",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          "post code": "K1A 0B1",
          country: "Canada",
          "country abbreviation": "CA",
          places: [
            {
              "place name": "Ottawa",
              state: "Ontario",
              "state abbreviation": "ON",
            },
          ],
        }),
      })
    );

    const out = await provider.verifyAddress({
      country: "CA",
      postalCode: "K1A 0B1",
      city: "Ottawa",
      stateProvince: "ON",
      addressLine1: "111 Wellington St",
    });
    expect(out.city).toBe("Ottawa");
    expect(out.stateProvince).toBe("ON");
  });

  it("rejects unsupported country and failed lookups", async () => {
    const provider = new ZippopotamAddressProvider({
      endpoint: "https://example.test",
    });
    await expect(
      provider.lookupPostalCode({ country: "US", postalCode: "   " })
    ).rejects.toThrow(/postalCode is required/);

    await expect(
      provider.lookupPostalCode({ country: "MX" as "US", postalCode: "12345" })
    ).rejects.toThrow(/does not support country/);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      })
    );
    await expect(
      provider.lookupPostalCode({ country: "CA", postalCode: "K1A 0B1" })
    ).rejects.toThrow(/status 404/);
  });

  it("rejects no-place and mismatch scenarios", async () => {
    const provider = new ZippopotamAddressProvider({
      endpoint: "https://example.test",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          "post code": "K1A 0B1",
          country: "Canada",
          "country abbreviation": "CA",
          places: [],
        }),
      })
    );
    await expect(
      provider.lookupPostalCode({ country: "CA", postalCode: "K1A 0B1" })
    ).rejects.toThrow(/no places/);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          "post code": "K1A 0B1",
          country: "Canada",
          "country abbreviation": "CA",
          places: [
            {
              "place name": "Ottawa",
              state: "Ontario",
              "state abbreviation": "ON",
            },
          ],
        }),
      })
    );
    await expect(
      provider.verifyAddress({
        country: "CA",
        postalCode: "K1A 0B1",
        city: "Toronto",
      })
    ).rejects.toThrow(/City mismatch/);

    await expect(
      provider.verifyAddress({
        country: "CA",
        postalCode: "K1A 0B1",
        stateProvince: "QC",
      })
    ).rejects.toThrow(/State\/Province mismatch/);
  });
});
