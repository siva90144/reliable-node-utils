import { describe, expect, it } from "vitest";
import { updateJsonData, updateJsonValues } from "../../src/json/index.js";

describe("json utils", () => {
  it("updates matching keys recursively", () => {
    const input = JSON.stringify({
      id: "1",
      nested: { id: "2", label: "x" },
      arr: [{ id: "3" }, { keep: "yes" }],
    });
    const outText = updateJsonValues(input, { id: "999", label: "updated" });
    const out = JSON.parse(outText) as {
      id: string;
      nested: { id: string; label: string };
      arr: Array<{ id?: string; keep?: string }>;
    };

    expect(out.id).toBe("999");
    expect(out.nested.id).toBe("999");
    expect(out.nested.label).toBe("updated");
    expect(out.arr[0]?.id).toBe("999");
    expect(out.arr[1]?.keep).toBe("yes");
  });

  it("supports legacy alias", () => {
    const input = JSON.stringify({ key: "old" });
    const out = JSON.parse(updateJsonData(input, { key: "new" })) as { key: string };
    expect(out.key).toBe("new");
  });

  it("throws for invalid root", () => {
    expect(() => updateJsonValues('"x"', { a: "1" })).toThrow(/root must be/);
  });
});
