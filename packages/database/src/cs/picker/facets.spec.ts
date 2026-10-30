// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "bun:test";
import { StateLeaf } from "../../shared/get-state-leaf.js";
import { StateTree } from "../../shared/types/state.js";
import {
  compareItemKeys,
  itemKeys,
  itemsBySet,
  reactionOptions,
  Selection,
} from "./facets.js";
import { IndexedState, ReactionIndex, Reversible } from "./types.js";

const states: Record<string, IndexedState> = {
  e: { latex: "e", children: [] },
  N2: { latex: "N2", children: ["N2X", "N2A"] },
  N2X: { latex: "X", children: ["N2Xv1"] },
  N2Xv1: { latex: "v1", children: [] },
  N2A: { latex: "A", children: [] },
  Ar: { latex: "Ar", children: [] },
  "Ar+": { latex: "Ar+", children: [] },
};

// Three reactions, of which the last one is reversible, in three cross
// sections. Set C is published, but has no cross sections.
const index: ReactionIndex = {
  reactions: [
    {
      consumes: ["e", "N2Xv1"],
      produces: ["e", "N2X"],
      typeTags: ["Vibrational"],
      reversible: false,
      items: [{ key: "1", sets: ["A"] }],
    },
    {
      consumes: ["e", "N2A"],
      produces: ["e", "N2"],
      typeTags: ["Electronic"],
      reversible: false,
      items: [{ key: "2", sets: ["A", "B"] }],
    },
    {
      consumes: ["e", "Ar"],
      produces: ["Ar+", "e"],
      typeTags: ["Ionization"],
      reversible: true,
      items: [{ key: "3", sets: ["B"] }],
    },
  ],
  states: new Map(Object.entries(states)),
  roots: ["e", "N2", "Ar", "Ar+"],
  parents: new Map([["N2X", "N2"], ["N2A", "N2"], ["N2Xv1", "N2X"]]),
  sets: [
    {
      key: "A",
      name: "A",
      organizationKey: "1",
      organizationName: "One",
    },
    {
      key: "C",
      name: "C",
      organizationKey: "1",
      organizationName: "One",
    },
    {
      key: "B",
      name: "B",
      organizationKey: "2",
      organizationName: "Two",
    },
  ],
};

const selection = (overrides: Partial<Selection> = {}): Selection => ({
  consumes: [undefined],
  produces: [undefined],
  typeTags: [],
  reversible: Reversible.Both,
  setKeys: [],
  ...overrides,
});

const leaf = (key: string, includeChildren = true): StateLeaf => ({
  key,
  includeChildren,
});

type Outline = Array<
  { latex: string; valid: boolean; children?: Outline }
>;

/** The tree without ids, in the order it is shown. */
const outline = (tree: StateTree): Outline =>
  Object.values(tree).map(({ latex, valid, children }) => ({
    latex,
    valid,
    ...(children && { children: outline(children) }),
  }));

const sets = (options: ReturnType<typeof reactionOptions>) =>
  Object.values(options.set).map(({ name, sets }) => [
    name,
    Object.values(sets),
  ]);

describe("reaction options without selection", () => {
  const options = reactionOptions(index, selection());

  it("should offer all consumed states, and the levels that lead to them", () => {
    expect(outline(options.consumes[0])).toEqual([
      { latex: "e", valid: true, children: [] },
      {
        latex: "N2",
        valid: false,
        children: [
          {
            latex: "X",
            valid: false,
            children: [{ latex: "v1", valid: true, children: [] }],
          },
          { latex: "A", valid: true, children: [] },
        ],
      },
      { latex: "Ar", valid: true, children: [] },
    ]);
  });

  it("should offer all produced states", () => {
    expect(outline(options.produces[0])).toEqual([
      { latex: "e", valid: true, children: [] },
      {
        latex: "N2",
        valid: true,
        children: [{
          latex: "X",
          valid: true,
          children: [],
        }],
      },
      { latex: "Ar+", valid: true, children: [] },
    ]);
  });

  it("should offer the type tags in the order of the reactions", () => {
    expect(options.typeTags).toEqual([
      "Vibrational",
      "Electronic",
      "Ionization",
    ]);
  });

  it("should offer all reversible choices", () => {
    expect(options.reversible).toEqual([
      Reversible.True,
      Reversible.False,
      Reversible.Both,
    ]);
  });

  it("should offer the sets with cross sections, grouped by organization", () => {
    expect(sets(options)).toEqual([["One", ["A"]], ["Two", ["B"]]]);
  });
});

describe("reaction options with a selected state", () => {
  it("should include the children of the state", () => {
    const options = reactionOptions(
      index,
      selection({ consumes: [leaf("N2")] }),
    );
    expect(options.typeTags).toEqual(["Vibrational", "Electronic"]);
    expect(itemKeys(index, selection({ consumes: [leaf("N2")] }))).toEqual([
      "1",
      "2",
    ]);
  });

  it("should only select the state itself without children", () => {
    const exact = selection({ consumes: [leaf("N2", false)] });
    expect(itemKeys(index, exact)).toEqual([]);

    const options = reactionOptions(index, exact);
    expect(options.typeTags).toEqual([]);
    expect(options.reversible).toEqual([]);
    expect(options.set).toEqual({});

    expect(itemKeys(index, selection({ consumes: [leaf("N2X", false)] })))
      .toEqual([]);
    expect(itemKeys(index, selection({ consumes: [leaf("N2Xv1", false)] })))
      .toEqual(["1"]);
  });

  it("should leave out the selection of an entry from its own options", () => {
    const options = reactionOptions(
      index,
      selection({ consumes: [leaf("Ar")] }),
    );
    // The entry itself still offers every consumed state, ...
    expect(outline(options.consumes[0]).map(({ latex }) => latex)).toEqual([
      "e",
      "N2",
      "Ar",
    ]);
    // ... but what it is combined with is narrowed down to what is produced.
    expect(outline(options.produces[0]).map(({ latex }) => latex)).toEqual([
      "e",
      "Ar+",
    ]);
  });

  it("should narrow an entry to the reactions of the other entries", () => {
    const options = reactionOptions(
      index,
      selection({ consumes: [leaf("N2"), undefined] }),
    );
    // The second entry cannot select what the first entry selected.
    expect(outline(options.consumes[1])).toEqual([
      { latex: "e", valid: true, children: [] },
    ]);
  });

  it("should match every selected state of a side", () => {
    const both = selection({
      consumes: [leaf("e"), leaf("Ar")],
      produces: [leaf("Ar+"), leaf("e")],
    });
    expect(itemKeys(index, both)).toEqual(["3"]);

    const none = selection({ consumes: [leaf("N2"), leaf("Ar")] });
    expect(itemKeys(index, none)).toEqual([]);
    expect(reactionOptions(index, none).typeTags).toEqual([]);
  });

  it("should offer one tree for every entry", () => {
    const options = reactionOptions(
      index,
      selection({
        consumes: [undefined, undefined],
        produces: [undefined, undefined, undefined],
      }),
    );
    expect(options.consumes).toHaveLength(2);
    expect(options.produces).toHaveLength(3);
  });
});

describe("reaction options with a type tag, reversibility, or set", () => {
  it("should narrow the other options, but not its own", () => {
    const options = reactionOptions(
      index,
      selection({ typeTags: ["Ionization"] }),
    );
    expect(options.typeTags).toEqual([
      "Vibrational",
      "Electronic",
      "Ionization",
    ]);
    expect(outline(options.consumes[0]).map(({ latex }) => latex)).toEqual([
      "e",
      "Ar",
    ]);
    expect(sets(options)).toEqual([["Two", ["B"]]]);
  });

  it("should offer the reversible choices of the matching reactions", () => {
    const options = reactionOptions(
      index,
      selection({ typeTags: ["Ionization"] }),
    );
    expect(options.reversible).toEqual([Reversible.True, Reversible.Both]);

    const irreversible = reactionOptions(
      index,
      selection({ consumes: [leaf("N2")] }),
    );
    expect(irreversible.reversible).toEqual([
      Reversible.False,
      Reversible.Both,
    ]);

    const reversible = reactionOptions(
      index,
      selection({ consumes: [leaf("Ar")] }),
    );
    expect(reversible.reversible).toEqual([Reversible.True, Reversible.Both]);
  });

  it("should select by reversibility", () => {
    const options = reactionOptions(
      index,
      selection({ reversible: Reversible.True }),
    );
    expect(options.typeTags).toEqual(["Ionization"]);
    expect(itemKeys(index, selection({ reversible: Reversible.False })))
      .toEqual(["1", "2"]);
  });

  it("should select by any of the type tags", () => {
    expect(
      itemKeys(index, selection({ typeTags: ["Vibrational", "Ionization"] })),
    ).toEqual(["1", "3"]);
  });

  it("should select the cross sections of the selected sets", () => {
    expect(itemKeys(index, selection({ setKeys: ["B"] }))).toEqual([
      "2",
      "3",
    ]);
    expect(itemKeys(index, selection({ setKeys: ["A", "B"] })))
      .toEqual(["1", "2", "3"]);
    expect(
      itemKeys(
        index,
        selection({ consumes: [leaf("N2")], setKeys: ["B"] }),
      ),
    ).toEqual(["2"]);
  });

  it("should narrow the options to the selected sets, but not the sets", () => {
    const options = reactionOptions(index, selection({ setKeys: ["B"] }));
    expect(options.typeTags).toEqual(["Electronic", "Ionization"]);
    expect(sets(options)).toEqual([["One", ["A"]], ["Two", ["B"]]]);
  });

  it("should select nothing for a set without cross sections", () => {
    expect(itemKeys(index, selection({ setKeys: ["C"] }))).toEqual([]);
  });
});

describe("items by set", () => {
  it("should list the cross sections of every set that has any", () => {
    // Set C has no cross sections, and CS/2 is in two sets.
    expect(itemsBySet(index, [selection()])).toEqual([
      { setKey: "A", itemKeys: ["1", "2"] },
      { setKey: "B", itemKeys: ["2", "3"] },
    ]);
  });

  it("should only list the cross sections that match the selection", () => {
    expect(itemsBySet(index, [selection({ consumes: [leaf("N2")] })]))
      .toEqual([
        { setKey: "A", itemKeys: ["1", "2"] },
        { setKey: "B", itemKeys: ["2"] },
      ]);
    expect(itemsBySet(index, [selection({ typeTags: ["Ionization"] })]))
      .toEqual([{ setKey: "B", itemKeys: ["3"] }]);
    expect(itemsBySet(index, [selection({ consumes: [leaf("N2", false)] })]))
      .toEqual([]);
  });

  it("should only list the selected sets", () => {
    expect(itemsBySet(index, [selection({ setKeys: ["B"] })])).toEqual([
      { setKey: "B", itemKeys: ["2", "3"] },
    ]);
    expect(
      itemsBySet(index, [
        selection({ consumes: [leaf("N2")], setKeys: ["A", "B"] }),
      ]),
    ).toEqual([
      { setKey: "A", itemKeys: ["1", "2"] },
      { setKey: "B", itemKeys: ["2"] },
    ]);
  });

  it("should merge the selections without duplicates", () => {
    const n2 = selection({ consumes: [leaf("N2")] });
    const ar = selection({ consumes: [leaf("Ar")] });

    expect(itemsBySet(index, [n2, ar, n2])).toEqual([
      { setKey: "A", itemKeys: ["1", "2"] },
      { setKey: "B", itemKeys: ["2", "3"] },
    ]);
    expect(itemsBySet(index, [])).toEqual([]);
  });

  it("should list the same cross sections as itemKeys, in every set", () => {
    const selected = selection({ consumes: [leaf("N2")] });
    const listed = new Set(
      itemsBySet(index, [selected]).flatMap(({ itemKeys }) => itemKeys),
    );
    expect([...listed].sort()).toEqual(itemKeys(index, selected).sort());
  });

  it("should list a cross section once per set", () => {
    const twice: ReactionIndex = {
      ...index,
      reactions: [{
        ...index.reactions[0],
        items: [{ key: "1", sets: ["A", "A"] }],
      }],
    };

    expect(itemsBySet(twice, [selection()])).toEqual([
      { setKey: "A", itemKeys: ["1"] },
    ]);
  });

  it("should order the cross sections of a set by key", () => {
    const keys = ["10", "9", "100", "2", "1"];
    const many: ReactionIndex = {
      ...index,
      reactions: keys.map((key) => ({
        ...index.reactions[0],
        items: [{ key, sets: ["A"] }],
      })),
    };

    expect(itemsBySet(many, [selection()])).toEqual([
      {
        setKey: "A",
        itemKeys: ["1", "2", "9", "10", "100"],
      },
    ]);
    // Keys that are not numbers come after the numbers, ordered as text.
    expect(["y", "10", "x", "9"].sort(compareItemKeys)).toEqual([
      "9",
      "10",
      "x",
      "y",
    ]);
  });
});
