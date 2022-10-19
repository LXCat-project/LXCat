import { Reference } from "@lxcat/schema/dist/core/reference";
import { expect, test, describe } from "vitest";
import { getReferenceLabel, reference2bibliography } from "./cite";

describe("reference2bibliography()", () => {
  test("should return apa style bibliography", () => {
    const input: Reference = {
      id: "ref1",
      type: "article",
      title: "First article",
    };
    const result = reference2bibliography(input);
    const expected = "First article. (n.d.).\n";
    expect(result).toEqual(expected);
  });
});

describe("getReferenceLabel", () => {
  test("should return a label", () => {
    const input: Reference = {
      id: "ref1",
      type: "article",
      title: "First article",
    };
    const result = getReferenceLabel(input);
    const expected = "First";
    expect(result).toEqual(expected);
  });
});
