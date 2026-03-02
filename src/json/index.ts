import { isPlainObject } from "../guards/index.js";

function updateAllKeysValues(
  target: Record<string, unknown>,
  updates: Record<string, string>
): void {
  for (const [key, value] of Object.entries(target)) {
    if (updates[key] !== undefined) {
      target[key] = updates[key];
      continue;
    }

    if (isPlainObject(value)) {
      updateAllKeysValues(value, updates);
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (isPlainObject(item)) {
          updateAllKeysValues(item, updates);
        }
      }
    }
  }
}

/**
 * Parse JSON text and recursively update matching keys.
 *
 * @param jsonText - JSON string input
 * @param updates - key/value map applied across nested objects and object arrays
 * @returns Pretty-printed updated JSON text
 */
export function updateJsonValues(
  jsonText: string,
  updates: Record<string, string>
): string {
  const parsed = JSON.parse(jsonText) as unknown;
  if (!isPlainObject(parsed) && !Array.isArray(parsed)) {
    throw new Error("updateJsonValues: root must be a JSON object or array.");
  }

  if (isPlainObject(parsed)) {
    updateAllKeysValues(parsed, updates);
  } else {
    for (const item of parsed) {
      if (isPlainObject(item)) {
        updateAllKeysValues(item, updates);
      }
    }
  }

  return JSON.stringify(parsed, null, 2);
}

/**
 * Backward-compatible alias for legacy naming.
 */
export const updateJsonData = updateJsonValues;
