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

const setNames = async (setIds: Array<string>) =>
  (await db.getSetHeadings(setIds)).map(({ name }) => name);

describe("cross sections by set", () => {
  it("should ignore templates that select nothing", async () => {
    expect(await db.getItemIdsBySet(defaultSearchTemplate())).toEqual([]);
  });

  it("should list the cross sections of the sets of a template", async () => {
    const n2 = await db.getItemIdsBySet([await consuming("\\mathrm{N_{2}}")]);

    expect(n2).toHaveLength(1);
    expect(n2[0].itemIds).toHaveLength(1);
    expect(await setNames([n2[0].setId])).toEqual(["N2 set"]);
  });

  it("should merge the templates without duplicates", async () => {
    const n2 = await consuming("\\mathrm{N_{2}}");
    const ar = await consuming("\\mathrm{Ar}");

    const sets = await db.getItemIdsBySet([n2, ar, n2]);
    expect(sets).toHaveLength(2);
    expect(sets.every(({ itemIds }) => itemIds.length === 1)).toBe(true);
    expect(await setNames(sets.map(({ setId }) => setId))).toEqual([
      "Ar set",
      "N2 set",
    ]);
  });

  it("should only list the sets that are selected", async () => {
    const [{ setId }] = await db.getItemIdsBySet([
      await consuming("\\mathrm{Ar}"),
    ]);

    const template = { ...defaultSearchTemplate()[0], set: [setId] };
    const sets = await db.getItemIdsBySet([template]);
    expect(sets.map((set) => set.setId)).toEqual([setId]);
  });
});

describe("cross sections in a set", () => {
  it("should list the cross sections of that set that match", async () => {
    const ar = await consuming("\\mathrm{Ar}");
    const [{ setId, itemIds }] = await db.getItemIdsBySet([ar]);

    expect(await db.getMatchingItemIdsInSet([ar], setId)).toEqual(itemIds);
  });

  it("should be empty for a set that has no match, and for nothing", async () => {
    const [{ setId: arSet }] = await db.getItemIdsBySet([
      await consuming("\\mathrm{Ar}"),
    ]);
    const n2 = await consuming("\\mathrm{N_{2}}");

    expect(await db.getMatchingItemIdsInSet([n2], arSet)).toEqual([]);
    expect(await db.getMatchingItemIdsInSet(defaultSearchTemplate(), arSet))
      .toEqual(
        [],
      );
    expect(await db.getMatchingItemIdsInSet([], arSet)).toEqual([]);
  });

  it("should respect the sets that a template selects", async () => {
    const ar = await consuming("\\mathrm{Ar}");
    const n2 = await consuming("\\mathrm{N_{2}}");
    const [{ setId: arSet }] = await db.getItemIdsBySet([ar]);
    const [{ setId: n2Set }] = await db.getItemIdsBySet([n2]);

    // Selecting only the N2 set, the Ar set has nothing that matches.
    const selecting = { ...ar, set: [n2Set] };
    expect(await db.getMatchingItemIdsInSet([selecting], arSet)).toEqual([]);
    expect(await db.getMatchingItemIdsInSet([{ ...ar, set: [arSet] }], arSet))
      .toHaveLength(1);
  });
});

describe("set headings", () => {
  it("should be sorted by organization and name, and leave out other sets", async () => {
    const all = await db.getItemIdsBySet([
      { ...defaultSearchTemplate()[0], typeTags: ["Effective", "Ionization"] },
    ]);
    expect(all.length).toBeGreaterThan(1);

    const headings = await db.getSetHeadings([
      ...all.map(({ setId }) => setId),
      "CrossSectionSet/does-not-exist",
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
    const [{ setId }] = await db.getItemIdsBySet([
      await consuming("\\mathrm{Ar}"),
    ]);
    const [heading] = await db.getSetHeadings([setId]);

    expect(heading.id).toBe(setId.replace("CrossSectionSet/", ""));
    expect(typeof heading.organization).toBe("string");
  });
});

describe("cross section headings", () => {
  const allIds = async () =>
    (await db.getItemIdsBySet([
      { ...defaultSearchTemplate()[0], typeTags: ["Effective", "Ionization"] },
    ])).flatMap(({ itemIds }) => itemIds);

  it("should be in the order of the ids", async () => {
    const ids = [...new Set(await allIds())];
    expect(ids.length).toBeGreaterThan(2);

    const keys = async (ids: Array<string>) =>
      (await db.getItemHeadings(ids)).map(({ id }) => `CrossSection/${id}`);

    expect(await keys(ids)).toEqual(ids);
    expect(await keys([...ids].reverse())).toEqual([...ids].reverse());
    expect([...await keys(ids.slice(0, 2)), ...await keys(ids.slice(2))])
      .toEqual(ids);
  });

  it("should leave out ids that do not exist", async () => {
    const [id] = await allIds();

    expect(
      (await db.getItemHeadings(["CrossSection/missing", id, "State/1"]))
        .map((heading) => `CrossSection/${heading.id}`),
    ).toEqual([id]);
    expect(await db.getItemHeadings([])).toEqual([]);
  });
});

describe("a set without an organization", () => {
  it("should have no heading", async () => {
    const [{ setId }] = await db.getItemIdsBySet([
      await consuming("\\mathrm{N_{2}}"),
    ]);
    expect(await setNames([setId])).toEqual(["N2 set"]);

    await db.getDB().query(aql`
      FOR css IN CrossSectionSet
        FILTER css._id == ${setId}
        REMOVE PARSE_IDENTIFIER(css.organization).key IN Organization
    `);

    expect(await db.getSetHeadings([setId])).toEqual([]);
  });
});
