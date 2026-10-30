// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { aql } from "arangojs";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import {
  sampleSets4Search,
  truncateCrossSectionSetCollections,
} from "../../../css/queries/testutils.js";
import { systemDb } from "../../../system-db.js";
import { LXCatTestDatabase } from "../../../testutils.js";
import { defaultSearchTemplate } from "../default.js";
import { ReactionTemplate } from "../types.js";

let db: LXCatTestDatabase;

beforeAll(async () => {
  db = await LXCatTestDatabase.createTestInstance(
    systemDb(),
    "items-by-set-test",
  );
  await db.setupTestUser();
  await sampleSets4Search(db);
});

afterAll(async () => systemDb().dropDatabase("items-by-set-test"));

/** A template that consumes the particle with the given LaTeX. */
const consuming = async (latex: string): Promise<ReactionTemplate> => {
  const [options] = await db.getSearchOptions(defaultSearchTemplate());
  const [particle] = options.consumes
    .flatMap(Object.entries)
    .find(([, summary]) => summary.latex === latex)!;

  return { ...defaultSearchTemplate()[0], consumes: [{ particle }] };
};

const setNames = async (setKeys: Array<string>) =>
  (await db.getSetHeadings(setKeys)).map(({ name }) => name);

describe("cross sections by set", () => {
  it("should ignore templates that select nothing", async () => {
    expect(await db.getItemKeysBySet(defaultSearchTemplate())).toEqual([]);
  });

  it("should list the cross sections of the sets of a template", async () => {
    const n2 = await db.getItemKeysBySet([await consuming("\\mathrm{N_{2}}")]);

    expect(n2).toHaveLength(1);
    expect(n2[0].itemKeys).toHaveLength(1);
    expect(await setNames([n2[0].setKey])).toEqual(["N2 set"]);
  });

  it("should merge the templates without duplicates", async () => {
    const n2 = await consuming("\\mathrm{N_{2}}");
    const ar = await consuming("\\mathrm{Ar}");

    const sets = await db.getItemKeysBySet([n2, ar, n2]);
    expect(sets).toHaveLength(2);
    expect(sets.every(({ itemKeys }) => itemKeys.length === 1)).toBe(true);
    expect(await setNames(sets.map(({ setKey }) => setKey))).toEqual([
      "Ar set",
      "N2 set",
    ]);
  });

  it("should only list the sets that are selected", async () => {
    const [{ setKey }] = await db.getItemKeysBySet([
      await consuming("\\mathrm{Ar}"),
    ]);

    const template = { ...defaultSearchTemplate()[0], set: [setKey] };
    const sets = await db.getItemKeysBySet([template]);
    expect(sets.map((set) => set.setKey)).toEqual([setKey]);
  });
});

describe("cross sections in a set", () => {
  it("should list the cross sections of that set that match", async () => {
    const ar = await consuming("\\mathrm{Ar}");
    const [{ setKey, itemKeys }] = await db.getItemKeysBySet([ar]);

    expect(await db.getMatchingItemKeysInSet([ar], setKey)).toEqual(itemKeys);
  });

  it("should be empty for a set that has no match, and for nothing", async () => {
    const [{ setKey: arSet }] = await db.getItemKeysBySet([
      await consuming("\\mathrm{Ar}"),
    ]);
    const n2 = await consuming("\\mathrm{N_{2}}");

    expect(await db.getMatchingItemKeysInSet([n2], arSet)).toEqual([]);
    expect(await db.getMatchingItemKeysInSet(defaultSearchTemplate(), arSet))
      .toEqual(
        [],
      );
    expect(await db.getMatchingItemKeysInSet([], arSet)).toEqual([]);
  });

  it("should respect the sets that a template selects", async () => {
    const ar = await consuming("\\mathrm{Ar}");
    const n2 = await consuming("\\mathrm{N_{2}}");
    const [{ setKey: arSet }] = await db.getItemKeysBySet([ar]);
    const [{ setKey: n2Set }] = await db.getItemKeysBySet([n2]);

    // Selecting only the N2 set, the Ar set has nothing that matches.
    const selecting = { ...ar, set: [n2Set] };
    expect(await db.getMatchingItemKeysInSet([selecting], arSet)).toEqual([]);
    expect(await db.getMatchingItemKeysInSet([{ ...ar, set: [arSet] }], arSet))
      .toHaveLength(1);
  });
});

describe("matching sets", () => {
  const allTypes = {
    ...defaultSearchTemplate()[0],
    typeTags: ["Effective", "Ionization"] as ReactionTemplate["typeTags"],
  };

  it("should be empty for templates that select nothing", async () => {
    expect(await db.getMatchingSets(defaultSearchTemplate())).toEqual({
      sets: [],
      itemKeys: [],
    });
  });

  it("should be the headings of the sets, with the number of matches", async () => {
    const bySet = await db.getItemKeysBySet([allTypes]);
    const headings = await db.getSetHeadings(bySet.map(({ setKey }) => setKey));
    const { sets } = await db.getMatchingSets([allTypes]);

    expect(sets.length).toBeGreaterThan(1);
    expect(sets.map(({ nrItems, ...heading }) => heading)).toEqual(headings);
    const counts = new Map(
      bySet.map(({ setKey, itemKeys }) => [setKey, itemKeys.length]),
    );
    expect(sets.map(({ nrItems }) => nrItems)).toEqual(
      headings.map(({ id }) => counts.get(id)),
    );
  });

  it("should have the keys of the cross sections without duplicates", async () => {
    const [ar, n2] = [
      await consuming("\\mathrm{Ar}"),
      await consuming("\\mathrm{N_{2}}"),
    ];
    const keys = (await db.getItemKeysBySet([ar, n2, ar])).flatMap((
      { itemKeys },
    ) => itemKeys);
    const { itemKeys } = await db.getMatchingSets([ar, n2, ar]);

    expect(itemKeys).toHaveLength(2);
    expect(itemKeys).toEqual(keys);
  });
});

describe("headings of the cross sections in a set", () => {
  it("should be the page of the matching cross sections", async () => {
    const ar = await consuming("\\mathrm{Ar}");
    const [{ setKey, itemKeys }] = await db.getItemKeysBySet([ar]);
    const headings = (offset: number, count: number) =>
      db.getMatchingItemHeadingsInSet([ar], setKey, { offset, count });

    expect(itemKeys).toHaveLength(1);
    expect((await headings(0, 20)).map(({ id }) => id)).toEqual(itemKeys);
    expect(await headings(1, 20)).toEqual([]);
    expect(await headings(0, 0)).toEqual([]);
  });

  it("should be empty for a set that has no match", async () => {
    const [{ setKey }] = await db.getItemKeysBySet([
      await consuming("\\mathrm{Ar}"),
    ]);

    expect(
      await db.getMatchingItemHeadingsInSet(
        [await consuming("\\mathrm{N_{2}}")],
        setKey,
        { offset: 0, count: 20 },
      ),
    ).toEqual([]);
  });
});

describe("set headings", () => {
  it("should be sorted by organization and name, and leave out other sets", async () => {
    const all = await db.getItemKeysBySet([
      { ...defaultSearchTemplate()[0], typeTags: ["Effective", "Ionization"] },
    ]);
    expect(all.length).toBeGreaterThan(1);

    const headings = await db.getSetHeadings([
      ...all.map(({ setKey }) => setKey),
      "does-not-exist",
    ]);
    expect(headings).toHaveLength(all.length);

    const sorted = [...headings].sort((a, b) =>
      a.organization === b.organization
        ? (a.name < b.name ? -1 : 1)
        : (a.organization < b.organization ? -1 : 1)
    );
    expect(headings.map(({ id }) => id)).toEqual(sorted.map(({ id }) => id));
  });

  it("should have the key of the set as id", async () => {
    const [{ setKey }] = await db.getItemKeysBySet([
      await consuming("\\mathrm{Ar}"),
    ]);
    const [heading] = await db.getSetHeadings([setKey]);

    expect(heading.id).toBe(setKey);
    expect(typeof heading.organization).toBe("string");
  });
});

describe("cross section headings", () => {
  const allKeys = async () =>
    (await db.getItemKeysBySet([
      { ...defaultSearchTemplate()[0], typeTags: ["Effective", "Ionization"] },
    ])).flatMap(({ itemKeys }) => itemKeys);

  it("should be in the order of the keys", async () => {
    const itemKeys = [...new Set(await allKeys())];
    expect(itemKeys.length).toBeGreaterThan(2);

    const keys = async (itemKeys: Array<string>) =>
      (await db.getItemHeadings(itemKeys)).map(({ id }) => id);

    expect(await keys(itemKeys)).toEqual(itemKeys);
    expect(await keys([...itemKeys].reverse())).toEqual(
      [...itemKeys].reverse(),
    );
    expect([
      ...await keys(itemKeys.slice(0, 2)),
      ...await keys(itemKeys.slice(2)),
    ]).toEqual(itemKeys);
  });

  it("should leave out keys that do not exist", async () => {
    const [key] = await allKeys();

    expect(
      (await db.getItemHeadings(["missing", key])).map(({ id }) => id),
    ).toEqual([key]);
    expect(await db.getItemHeadings([])).toEqual([]);
  });

  it("should leave out keys of documents that are not cross sections", async () => {
    const [{ setKey, itemKeys: [key] }] = await db.getItemKeysBySet([
      await consuming("\\mathrm{Ar}"),
    ]);

    // The set is published, like the cross section, and its key is not the key
    // of a cross section.
    expect(await setNames([setKey])).toEqual(["Ar set"]);
    expect(
      (await db.getItemHeadings([setKey, key])).map(({ id }) => id),
    ).toEqual([key]);
  });
});

describe("a set without an organization", () => {
  it("should have no heading", async () => {
    const [{ setKey }] = await db.getItemKeysBySet([
      await consuming("\\mathrm{N_{2}}"),
    ]);
    expect(await setNames([setKey])).toEqual(["N2 set"]);

    await db.getDB().query(aql`
      FOR css IN CrossSectionSet
        FILTER css._key == ${setKey}
        REMOVE PARSE_IDENTIFIER(css.organization).key IN Organization
    `);

    expect(await db.getSetHeadings([setKey])).toEqual([]);
  });
});
