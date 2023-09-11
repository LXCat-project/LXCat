import { describe, expect, it } from "vitest";
import OriginalLTPMixtureSchema from "../test-data/LTPMixture.schema.json";
import { LTPMixtureSchema } from "./mixture";

describe("JSON Schema creation regression tests", () => {
  it("LTPMixture", () => {
    expect(LTPMixtureSchema).toStrictEqual(OriginalLTPMixtureSchema);
  });
});
