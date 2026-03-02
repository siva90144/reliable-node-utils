/**
 * Rename a key in a string map and strip wrapping quotes from its value.
 *
 * @returns true if key existed and was renamed, else false.
 */
export function renameMapKey(
  data: Map<string, string>,
  oldKey: string,
  newKey: string
): boolean {
  if (!data.has(oldKey)) return false;
  let value = data.get(oldKey) ?? "";
  value = value.replace(/^"(.*)"$/, "$1");
  data.delete(oldKey);
  data.set(newKey, value);
  return true;
}

/**
 * Backward-compatible alias for legacy naming.
 */
export const updateKey = renameMapKey;
