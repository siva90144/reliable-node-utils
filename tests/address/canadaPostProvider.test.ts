import { afterEach, describe, expect, it, vi } from "vitest";
import { CanadaPostAddressProvider } from "../../src/address/index.js";

describe("CanadaPostAddressProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("looks up CA postal code via find+retrieve", async () => {
    const provider = new CanadaPostAddressProvider({
      key: "TEST_KEY",
      findEndpoint: "https://example.test/find",
      retrieveEndpoint: "https://example.test/retrieve",
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Items: [{ Id: "CA|12345|A" }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Items: [
            {
              Line1: "111 WELLINGTON ST",
              City: "OTTAWA",
              ProvinceCode: "ON",
              PostalCode: "K1A 0A9",
            },
          ],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const out = await provider.lookupPostalCode({
      country: "CA",
      postalCode: "K1A0A9",
    });
    expect(out.city).toBe("OTTAWA");
    expect(out.stateProvince).toBe("ON");
    expect(out.postalCode).toBe("K1A 0A9");
    expect(out.source).toBe("CanadaPost");
  });

  it("verifies full address and normalizes output", async () => {
    const provider = new CanadaPostAddressProvider({
      key: "TEST_KEY",
      findEndpoint: "https://example.test/find",
      retrieveEndpoint: "https://example.test/retrieve",
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Items: [{ Id: "CA|XYZ|A" }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Items: [
            {
              Line1: "111 WELLINGTON ST",
              Line2: "STE 100",
              City: "OTTAWA",
              ProvinceCode: "ON",
              PostalCode: "K1A 0A9",
            },
          ],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const out = await provider.verifyAddress({
      country: "CA",
      postalCode: "K1A0A9",
      city: "Ottawa",
      stateProvince: "ON",
      addressLine1: "111 Wellington St",
      addressLine2: "Ste 100",
    });
    expect(out.addressLine1).toBe("111 WELLINGTON ST");
    expect(out.addressLine2).toBe("STE 100");
    expect(out.postalCode).toBe("K1A 0A9");
  });

  it("rejects invalid setup and unsupported country", async () => {
    expect(() => new CanadaPostAddressProvider({ key: "" })).toThrow(/key/);
    const provider = new CanadaPostAddressProvider({ key: "TEST_KEY" });
    await expect(
      provider.lookupPostalCode({ country: "US", postalCode: "90210" })
    ).rejects.toThrow(/does not support country/);
  });

  it("rejects invalid postal code and missing address line for verify", async () => {
    const provider = new CanadaPostAddressProvider({ key: "TEST_KEY" });
    await expect(
      provider.lookupPostalCode({ country: "CA", postalCode: "12345" })
    ).rejects.toThrow(/valid Canadian postal code/);
    await expect(
      provider.verifyAddress({ country: "CA", postalCode: "K1A0A9" })
    ).rejects.toThrow(/addressLine1/);
  });

  it("handles find/retrieve and mismatch failures", async () => {
    const provider = new CanadaPostAddressProvider({
      key: "TEST_KEY",
      findEndpoint: "https://example.test/find",
      retrieveEndpoint: "https://example.test/retrieve",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      })
    );
    await expect(
      provider.lookupPostalCode({ country: "CA", postalCode: "K1A0A9" })
    ).rejects.toThrow(/find failed with status 500/);

    const noItemsFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [] }),
      });
    vi.stubGlobal("fetch", noItemsFetch);
    await expect(
      provider.lookupPostalCode({ country: "CA", postalCode: "K1A0A9" })
    ).rejects.toThrow(/no candidate/);

    const missingDataFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [{ Id: "id1" }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [{}] }),
      });
    vi.stubGlobal("fetch", missingDataFetch);
    await expect(
      provider.lookupPostalCode({ country: "CA", postalCode: "K1A0A9" })
    ).rejects.toThrow(/incomplete response/);

    const mismatchFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [{ Id: "id1" }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Items: [
            {
              Line1: "111 WELLINGTON ST",
              City: "OTTAWA",
              ProvinceCode: "ON",
              PostalCode: "H2X 1Y4",
            },
          ],
        }),
      });
    vi.stubGlobal("fetch", mismatchFetch);
    await expect(
      provider.verifyAddress({
        country: "CA",
        postalCode: "K1A0A9",
        addressLine1: "111 Wellington St",
      })
    ).rejects.toThrow(/Postal code mismatch/);
  });
});
