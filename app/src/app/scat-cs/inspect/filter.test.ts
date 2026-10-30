// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from "bun:test";
import { DenormalizedProcess } from "../denormalized-process";
import { filterOptions, filterProcesses, noFilters } from "./filter";

const set = (key: string, name: string, organization: string) => ({
  _key: key,
  name,
  contributor: { name: organization },
});

const process = (
  key: string,
  typeTags: Array<string>,
  isPartOf: Array<ReturnType<typeof set>>,
) =>
  ({
    reaction: { typeTags },
    info: { _key: key, isPartOf },
  }) as unknown as DenormalizedProcess;

const s1 = set("s1", "Set 1", "Org A");
const s2 = set("s2", "Set 2", "Org A");
const s3 = set("s3", "Set 1", "Org B");

const a = process("a", ["Elastic"], [s1]);
const b = process("b", ["Elastic", "Effective"], [s2]);
const c = process("c", ["Ionization"], [s3]);
// In two sets of different databases.
const d = process("d", ["Ionization"], [s1, s3]);
const processes = [a, b, c, d];

const keys = (processes: Array<DenormalizedProcess>) =>
  processes.map(({ info: { _key } }) => _key);

describe("filterProcesses", () => {
  test("keeps everything without filters", () => {
    expect(keys(filterProcesses(processes, noFilters))).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  test("matches any of the type tags", () => {
    const filters = { ...noFilters, tags: ["Effective", "Ionization"] };
    expect(keys(filterProcesses(processes, filters))).toEqual(["b", "c", "d"]);
  });

  test("matches any of the databases of the sets", () => {
    const filters = { ...noFilters, organizations: ["Org B"] };
    expect(keys(filterProcesses(processes, filters))).toEqual(["c", "d"]);
  });

  test("matches any of the sets", () => {
    const filters = { ...noFilters, sets: ["s1"] };
    expect(keys(filterProcesses(processes, filters))).toEqual(["a", "d"]);
  });

  test("matches all of the filters", () => {
    const filters = {
      tags: ["Ionization"],
      organizations: ["Org A"],
      sets: [],
    };
    expect(keys(filterProcesses(processes, filters))).toEqual(["d"]);
  });
});

describe("filterOptions", () => {
  test("lists everything without filters", () => {
    expect(filterOptions(processes, noFilters)).toEqual({
      tags: ["Elastic", "Effective", "Ionization"],
      organizations: ["Org A", "Org B"],
      sets: [
        {
          group: "Org A",
          items: [{ value: "s1", label: "Set 1" }, {
            value: "s2",
            label: "Set 2",
          }],
        },
        { group: "Org B", items: [{ value: "s3", label: "Set 1" }] },
      ],
    });
  });

  test("lists what the filters of the other columns leave", () => {
    const options = filterOptions(processes, {
      ...noFilters,
      tags: ["Elastic"],
    });
    // The tags are not narrowed by the tag filter itself.
    expect(options.tags).toEqual(["Elastic", "Effective", "Ionization"]);
    expect(options.organizations).toEqual(["Org A"]);
    expect(options.sets.map(({ items }) => items.map(({ value }) => value)))
      .toEqual([["s1", "s2"]]);
  });

  test("keeps the chosen values that the other filters hide", () => {
    const filters = { tags: ["Elastic"], organizations: [], sets: ["s3"] };
    expect(filterOptions(processes, filters).sets).toEqual([
      {
        group: "Org A",
        items: [{ value: "s1", label: "Set 1" }, {
          value: "s2",
          label: "Set 2",
        }],
      },
      { group: "Org B", items: [{ value: "s3", label: "Set 1" }] },
    ]);
  });
});
