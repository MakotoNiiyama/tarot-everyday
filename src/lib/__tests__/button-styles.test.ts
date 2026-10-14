import { describe, it, expect } from "vitest";
import { primaryButton, secondaryButton, outlineButton } from "../button-styles";

/** Count tokens matching a prefix (e.g. "min-h-") in a class string */
function countTokens(classes: string, prefix: string): number {
  return classes.split(/\s+/).filter((t) => t.startsWith(prefix)).length;
}

describe("button-styles", () => {
  const variants = [
    { name: "primaryButton", cls: primaryButton },
    { name: "secondaryButton", cls: secondaryButton },
    { name: "outlineButton", cls: outlineButton },
  ];

  for (const { name, cls } of variants) {
    it(`${name} has exactly one min-h- token`, () => {
      expect(countTokens(cls, "min-h-")).toBe(1);
    });

    it(`${name} has at most one text-[ size token`, () => {
      expect(countTokens(cls, "text-[")).toBeLessThanOrEqual(1);
    });

    it(`${name} has at most one font- token`, () => {
      expect(countTokens(cls, "font-")).toBeLessThanOrEqual(1);
    });
  }
});
