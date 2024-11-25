// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import OriginalLTPMixtureSchema from "../test-data/LTPMixture.schema.json" assert {
  type: "json",
};
import { LTPMixtureJSONSchema } from "./mixture.js";

describe("JSON Schema creation regression tests", () => {
  it("LTPMixture", () => {
    expect(LTPMixtureJSONSchema).toStrictEqual(OriginalLTPMixtureSchema);
  });
});
