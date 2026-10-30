// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from "bun:test";
import { DenormalizedProcess } from "../denormalized-process";
import { toggleAll } from "./selection";

const process = (key: string) =>
  ({ info: { _key: key } }) as DenormalizedProcess;
const keys = (processes: Array<DenormalizedProcess>) =>
  processes.map(({ info: { _key } }) => _key);

const processes = ["a", "b", "c", "d", "e"].map(process);
const [a, b, c, d, e] = processes;

describe("toggleAll", () => {
  test("selects every shown process when none is selected", () => {
    expect(keys(toggleAll(processes, [b, c, d], []))).toEqual(["b", "c", "d"]);
  });

  test("deselects the shown processes when all are selected", () => {
    expect(keys(toggleAll(processes, [b, c], [a, b, c, e]))).toEqual([
      "a",
      "e",
    ]);
  });

  test("deselects the shown processes when some are selected", () => {
    expect(keys(toggleAll(processes, [b, c, d], [c, e]))).toEqual(["e"]);
  });

  test("keeps the selected processes that are hidden", () => {
    expect(keys(toggleAll(processes, [b, c], [a]))).toEqual(["a", "b", "c"]);
  });

  test("follows the order of the processes", () => {
    expect(keys(toggleAll(processes, [e, a], [d]))).toEqual(["a", "d", "e"]);
  });
});
