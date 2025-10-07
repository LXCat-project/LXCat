// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from "bun:test";
import { BAG_SIZE, PLOT_SIZE } from "../../cs/constants";
import { IdsSchema, PlotIdsSchema } from "./ids-schema";

const ids = (n: number) => Array.from({ length: n }, (_, i) => String(i + 1));

describe("the ids of the plot and compute pages", () => {
  test("are at most PLOT_SIZE", () => {
    expect(PlotIdsSchema.safeParse(ids(PLOT_SIZE)).success).toBe(true);
    expect(PlotIdsSchema.safeParse(ids(PLOT_SIZE + 1)).success).toBe(false);
  });

  test("are not empty, and unique", () => {
    expect(PlotIdsSchema.safeParse([]).success).toBe(false);
    expect(PlotIdsSchema.safeParse(["1", "1"]).success).toBe(false);
  });
});

describe("the ids of the API", () => {
  test("stay at most BAG_SIZE", () => {
    expect(IdsSchema.safeParse(ids(BAG_SIZE)).success).toBe(true);
    expect(IdsSchema.safeParse(ids(BAG_SIZE + 1)).success).toBe(false);
  });
});
