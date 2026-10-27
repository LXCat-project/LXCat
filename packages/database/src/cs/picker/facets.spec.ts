// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "bun:test";
import { StateLeaf } from "../../shared/get-state-leaf.js";
import { StateTree } from "../../shared/types/state.js";
import { itemIds, reactionOptions, Selection } from "./facets.js";
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
      items: [{ id: "CS/1", sets: ["Set/A"] }],
    },
    {
      consumes: ["e", "N2A"],
      produces: ["e", "N2"],
      typeTags: ["Electronic"],
      reversible: false,
      items: [{ id: "CS/2", sets: ["Set/A", "Set/B"] }],
    },
    {
      consumes: ["e", "Ar"],
      produces: ["Ar+", "e"],
      typeTags: ["Ionization"],
      reversible: true,
      items: [{ id: "CS/3", sets: ["Set/B"] }],
    },
  ],
  states: new Map(Object.entries(states)),
  roots: ["e", "N2", "Ar", "Ar+"],
  parents: new Map([["N2X", "N2"], ["N2A", "N2"], ["N2Xv1", "N2X"]]),
  sets: [
    {
      id: "Set/A",
      name: "A",
      organizationId: "Org/1",
      organizationName: "One",
    },
    {
      id: "Set/C",
      name: "C",
      organizationId: "Org/1",
      organizationName: "One",
    },
    {
      id: "Set/B",
      name: "B",
      organizationId: "Org/2",
      organizationName: "Two",
    },
  ],
};

const selection = (overrides: Partial<Selection> = {}): Selection => ({
  consumes: [undefined],
  produces: [undefined],
  typeTags: [],
  reversible: Reversible.Both,
  setIds: [],
  ...overrides,
});

const leaf = (id: string, includeChildren = true): StateLeaf => ({
  id,
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
    expect(itemIds(index, selection({ consumes: [leaf("N2")] }))).toEqual([
      "CS/1",
      "CS/2",
    ]);
  });

  it("should only select the state itself without children", () => {
    const exact = selection({ consumes: [leaf("N2", false)] });
    expect(itemIds(index, exact)).toEqual([]);

    const options = reactionOptions(index, exact);
    expect(options.typeTags).toEqual([]);
    expect(options.reversible).toEqual([]);
    expect(options.set).toEqual({});

    expect(itemIds(index, selection({ consumes: [leaf("N2X", false)] })))
      .toEqual([]);
    expect(itemIds(index, selection({ consumes: [leaf("N2Xv1", false)] })))
      .toEqual(["CS/1"]);
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
    expect(itemIds(index, both)).toEqual(["CS/3"]);

    const none = selection({ consumes: [leaf("N2"), leaf("Ar")] });
    expect(itemIds(index, none)).toEqual([]);
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
    expect(itemIds(index, selection({ reversible: Reversible.False })))
      .toEqual(["CS/1", "CS/2"]);
  });

  it("should select by any of the type tags", () => {
    expect(
      itemIds(index, selection({ typeTags: ["Vibrational", "Ionization"] })),
    ).toEqual(["CS/1", "CS/3"]);
  });

  it("should select the cross sections of the selected sets", () => {
    expect(itemIds(index, selection({ setIds: ["Set/B"] }))).toEqual([
      "CS/2",
      "CS/3",
    ]);
    expect(itemIds(index, selection({ setIds: ["Set/A", "Set/B"] })))
      .toEqual(["CS/1", "CS/2", "CS/3"]);
    expect(
      itemIds(
        index,
        selection({ consumes: [leaf("N2")], setIds: ["Set/B"] }),
      ),
    ).toEqual(["CS/2"]);
  });

  it("should narrow the options to the selected sets, but not the sets", () => {
    const options = reactionOptions(index, selection({ setIds: ["Set/B"] }));
    expect(options.typeTags).toEqual(["Electronic", "Ionization"]);
    expect(sets(options)).toEqual([["One", ["A"]], ["Two", ["B"]]]);
  });

  it("should select nothing for a set without cross sections", () => {
    expect(itemIds(index, selection({ setIds: ["Set/C"] }))).toEqual([]);
  });
});
