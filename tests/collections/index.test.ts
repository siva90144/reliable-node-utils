import { describe, expect, it } from "vitest";
import { renameMapKey, updateKey } from "../../src/collections/index.js";

describe("collections utils", () => {
  it("renames key and strips wrapping quotes from value", () => {
    const map = new Map<string, string>([["old", '"value"']]);
    const changed = renameMapKey(map, "old", "new");
    expect(changed).toBe(true);
    expect(map.has("old")).toBe(false);
    expect(map.get("new")).toBe("value");
  });

  it("returns false when old key does not exist", () => {
    const map = new Map<string, string>([["x", "1"]]);
    expect(updateKey(map, "old", "new")).toBe(false);
    expect(map.get("x")).toBe("1");
  });
});
