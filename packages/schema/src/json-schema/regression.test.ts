import { describe, expect, it } from "vitest";
import OriginalLTPMixtureSchema from "../test-data/LTPMixture.schema.json";
import { LTPMixtureJSONSchema } from "./mixture";

describe("JSON Schema creation regression tests", () => {
  it("LTPMixture", () => {
    expect(LTPMixtureJSONSchema).toStrictEqual(OriginalLTPMixtureSchema);
  });
});
