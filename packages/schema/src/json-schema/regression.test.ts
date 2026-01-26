// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "bun:test";
import OriginalLTPMixtureSchema from "../test-data/LTPMixture.schema.json" with {
  type: "json",
};
import { LTPMixtureJSONSchema } from "./mixture.js";

describe("JSON Schema creation regression tests", () => {
  it("LTPMixture", () => {
    expect(OriginalLTPMixtureSchema as unknown).toStrictEqual(
      LTPMixtureJSONSchema,
    );
  });
});
