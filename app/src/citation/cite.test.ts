// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Reference } from "@lxcat/schema";
import { describe, expect, test } from "bun:test";
import {
  formatReference,
  getReferenceFromBibTeX,
  getReferenceLabel,
} from "./cite";

describe("formatReference()", () => {
  test("should return apa style bibliography for single reference", async () => {
    const input: Reference = {
      id: "ref1",
      type: "article",
      title: "First article",
    };
    const result = await formatReference(input);
    const expected = "First article. (n.d.).\n";
    expect(result).toEqual(expected);
  });

  test("should return array of bibliographies for array of references", async () => {
    const input: Array<Reference> = [
      { id: "ref1", type: "article", title: "First article" },
      { id: "ref2", type: "article", title: "Second article" },
    ];
    const result = await formatReference(input);
    expect(result).toEqual([
      "First article. (n.d.).\n",
      "Second article. (n.d.).\n",
    ]);
  });

  test("should return dictionary of bibliographies for Record of references", async () => {
    const input: Record<string, Reference> = {
      r1: { id: "ref1", type: "article", title: "First article" },
      r2: { id: "ref2", type: "article", title: "Second article" },
    };
    const result = await formatReference(input);
    expect(result).toEqual({
      r1: "First article. (n.d.).\n",
      r2: "Second article. (n.d.).\n",
    });
  });
});

describe("getReferenceLabel", () => {
  test("should return a label for single reference", async () => {
    const input: Reference = {
      id: "ref1",
      type: "article",
      title: "First article",
    };
    const result = await getReferenceLabel(input);
    const expected = "First";
    expect(result).toEqual(expected);
  });

  test("should return array of labels for array of references", async () => {
    const input: Array<Reference> = [
      { id: "ref1", type: "article", title: "First article" },
      { id: "ref2", type: "article", title: "Second article" },
    ];
    const result = await getReferenceLabel(input);
    expect(result).toEqual(["First", "Second"]);
  });
});

describe("getReferenceFromBibTeX()", () => {
  test("should parse BibTeX into CSL references record", async () => {
    const input = `
@Article{atoms9010016,
    AUTHOR = {Carbone, Emile and Graef, Wouter},
    TITLE = {Data Needs for Modeling},
    JOURNAL = {Atoms},
    YEAR = {2021}
}
`;
    const result = await getReferenceFromBibTeX(input);
    expect(result).toHaveProperty("Carbone2021Data");
    expect(result.Carbone2021Data.title).toBe("Data Needs for Modeling");
  });
});
