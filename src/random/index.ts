const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const ALPHABETIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function assertPositiveLength(length: number, fnName: string): void {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error(`${fnName}: length must be a positive integer.`);
  }
}

function randomIndex(length: number, rng: () => number): number {
  return Math.floor(rng() * length);
}

/**
 * Generate random alphanumeric string.
 */
export function generateRandomAlphanumericString(
  length: number,
  options: { uppercase?: boolean; rng?: () => number } = {}
): string {
  assertPositiveLength(length, "generateRandomAlphanumericString");
  const rng = options.rng ?? Math.random;
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHANUMERIC.charAt(randomIndex(ALPHANUMERIC.length, rng));
  }
  return (options.uppercase ?? true) ? out.toUpperCase() : out;
}

/**
 * Generate random N-digit integer (base-10).
 *
 * @throws {Error} If length is invalid
 */
export function generateRandomNDigitNumber(
  length: number,
  options: { rng?: () => number } = {}
): number {
  assertPositiveLength(length, "generateRandomNDigitNumber");
  if (length > 15) {
    throw new Error(
      "generateRandomNDigitNumber: length must be <= 15 for safe integers."
    );
  }
  const rng = options.rng ?? Math.random;
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Generate random alphabetic string (letters only).
 */
export function generateRandomAlphabeticString(
  length: number,
  options: { rng?: () => number } = {}
): string {
  assertPositiveLength(length, "generateRandomAlphabeticString");
  const rng = options.rng ?? Math.random;
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABETIC.charAt(randomIndex(ALPHABETIC.length, rng));
  }
  return out;
}

/**
 * Backward-compatible alias for legacy naming.
 */
export const getAlphaNumericString = generateRandomAlphanumericString;

/**
 * Backward-compatible alias for legacy naming.
 */
export const generateRandomNumber = generateRandomNDigitNumber;

/**
 * Backward-compatible alias for legacy naming.
 */
export const generateRandomString = generateRandomAlphabeticString;
