// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Reference } from "@lxcat/schema";
import { describe, expect, test } from "bun:test";
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
