// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { AnyAtom } from "./atoms";
import { AnyMolecule } from "./molecules";
import { parseCharge, parseState } from "./parse";
import { AnyParticle, State } from "./state";

describe("parseCharge()", () => {
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

describe("parseState()", () => {
  const testCases: Array<[State<AnyAtom | AnyMolecule | AnyParticle>, string]> =
    [
      [
        {
          type: "simple",
          particle: "Uo",
          charge: -42,
        },
        "\\mathrm{Uo^{42-}}",
      ],
      [{ type: "simple", particle: "e", charge: -1 }, "\\mathrm{e}"],
    ];
  it.each(testCases)("given %d should render %s", (input, expected) => {
    const result = parseState(input);
    expect(result.latex).toEqual(expected);
  });
});
