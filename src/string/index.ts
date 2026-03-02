/**
 * Replace `{key}` placeholders in a template string with quoted values.
 *
 * @param template - Input template containing placeholders like `{name}`
 * @param replacements - Key/value mapping for placeholders
 * @returns Formatted string with replacements wrapped in double quotes
 *
 * @example
 * ```ts
 * const out = replaceTemplateValues("Hello {name}", { name: "Sam" });
 * // Hello "Sam"
 * ```
 */
export function replaceTemplateValues(
  template: string,
  replacements: Record<string, unknown>
): string {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.split(`{${key}}`).join(`"${String(value)}"`);
  }
  return result;
}

/**
 * Split a string using a delimiter.
 */
export function splitString(input: string, delimiter: string): string[] {
  return input.split(delimiter);
}

/**
 * Parse a strict boolean string (`true`/`false`, case-insensitive).
 *
 * @throws {Error} If input is empty or not a valid boolean string
 */
export function parseBooleanString(input: string | undefined | null): boolean {
  if (input === undefined || input === null || input.trim() === "") {
    throw new Error("No input provided.");
  }
  const normalized = input.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  throw new Error(`Cannot convert string "${input}" to boolean.`);
}

/**
 * True when value is null/undefined/empty-after-trim.
 */
export function isNullOrEmptyString(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.trim() === "";
}

/**
 * Convert snake_case (or mixed case) string into PascalCase.
 *
 * @example
 * ```ts
 * snakeToPascalCase("user_name"); // UserName
 * ```
 */
export function snakeToPascalCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/_([a-z])/g, (_match, char: string) => char.toUpperCase())
    .replace(/^\w/, (char) => char.toUpperCase());
}

/**
 * Backward-compatible alias; output is PascalCase.
 */
export const convertToCamelCase = snakeToPascalCase;

/**
 * Backward-compatible alias for legacy naming.
 */
export const formatStringValue = replaceTemplateValues;
