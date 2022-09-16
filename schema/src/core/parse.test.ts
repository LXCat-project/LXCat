import { describe, expect, it } from "vitest";
import { parseCharge } from "./parse";

describe("parse_charge()", () => {
  const testCases: Array<[number, string]> = [
    [0, ""],
    [1, "^+"],
    [-1, "^-"],
    [2, "^2+"],
    [-2, "^2-"],
  ];
  it.each(testCases)("given %d should render %s", (input, expected) => {
    const result = parseCharge(input);
    expect(result).toEqual(expected);
  });
});
