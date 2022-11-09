// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";

import { parity, combineParity } from "./parity";

describe("parity", () => {
  test("calculation", () => {
    let orbital = 2;
    let occupance = 1;
    expect(parity(orbital, occupance)).toEqual(1);

    orbital = 1;
    occupance = 3;
    expect(parity(orbital, occupance)).toEqual(-1);
  });

  test("combination", () => {
    let parities = [1, -1, 1, -1];
    expect(combineParity(parities)).toEqual(1);
    parities = [-1, 1, -1, 1, -1];
    expect(combineParity(parities)).toEqual(-1);
  });
});
