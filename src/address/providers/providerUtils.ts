import { AddressProviderError } from "../errors.js";
import type { SupportedCountryCode } from "../types.js";

export function assertProviderSupportsCountry(args: {
  providerName: string;
  country: SupportedCountryCode;
  supportsCountry: (country: SupportedCountryCode) => boolean;
}): void {
  if (!args.supportsCountry(args.country)) {
    throw new AddressProviderError(
      `${args.providerName} provider does not support country ${args.country}`
    );
  }
}

export function normalizeComparable(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, " ");
}

export function normalizePostalComparable(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export async function fetchJsonOrThrow<T>(
  url: string,
  options: { signal?: AbortSignal; errorPrefix: string }
): Promise<T> {
  const res = await fetch(url, { method: "GET", signal: options.signal });
  if (!res.ok) {
    throw new AddressProviderError(
      `${options.errorPrefix} failed with status ${res.status}`
    );
  }
  return (await res.json()) as T;
}

export async function fetchTextOrThrow(
  url: string,
  options: { signal?: AbortSignal; errorPrefix: string }
): Promise<string> {
  const res = await fetch(url, { method: "GET", signal: options.signal });
  if (!res.ok) {
    throw new AddressProviderError(
      `${options.errorPrefix} failed with status ${res.status}`
    );
  }
  return await res.text();
}
