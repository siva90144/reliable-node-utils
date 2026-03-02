import { describe, expect, it } from "vitest";
import {
  convertToCamelCase,
  formatStringValue,
  isNullOrEmptyString,
  parseBooleanString,
  replaceTemplateValues,
  snakeToPascalCase,
  splitString,
} from "../../src/string/index.js";

describe("string utils", () => {
  it("replaces template placeholders with quoted values", () => {
    const out = replaceTemplateValues("Hello {name}, id={id}", {
      name: "Sam",
      id: 101,
    });
    expect(out).toBe('Hello "Sam", id="101"');
    expect(formatStringValue("A {x}", { x: "B" })).toBe('A "B"');
  });

  it("splits strings by delimiter", () => {
    expect(splitString("a,b,c", ",")).toEqual(["a", "b", "c"]);
  });

  it("parses strict booleans", () => {
    expect(parseBooleanString("true")).toBe(true);
    expect(parseBooleanString(" FALSE ")).toBe(false);
    expect(() => parseBooleanString("")).toThrow(/No input/);
    expect(() => parseBooleanString("yes")).toThrow(/Cannot convert/);
  });

  it("checks null/empty strings", () => {
    expect(isNullOrEmptyString(null)).toBe(true);
    expect(isNullOrEmptyString(undefined)).toBe(true);
    expect(isNullOrEmptyString("   ")).toBe(true);
    expect(isNullOrEmptyString("x")).toBe(false);
  });

  it("converts snake_case to PascalCase", () => {
    expect(snakeToPascalCase("user_name")).toBe("UserName");
    expect(convertToCamelCase("HELLO_WORLD")).toBe("HelloWorld");
  });
});
