// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type ReactionTypeTag } from "@lxcat/schema/process";
import { StateLeaf } from "../../shared/get-state-leaf.js";
import { StateSummary, StateTree } from "../../shared/types/state.js";
import {
  CSSetTree,
  IndexedReaction,
  MAX_STATE_DEPTH,
  ReactionIndex,
  ReactionOptions,
  Reversible,
} from "./types.js";

/**
 * What the user selected for a reaction.
 *
 * The slots hold the selected state of each entry of the left-hand and
 * right-hand side, or `undefined` for an entry that is still empty.
 */
export interface Selection {
  consumes: Array<StateLeaf | undefined>;
  produces: Array<StateLeaf | undefined>;
  typeTags: Array<ReactionTypeTag>;
  reversible: Reversible;
  setIds: Array<string>;
}

/** Whether `state` is `id`, or when `includeChildren` is set, below it. */
const isSelected = (
  index: ReactionIndex,
  state: string,
  { id, includeChildren }: StateLeaf,
) => {
  for (
    let current: string | undefined = state;
    current !== undefined;
    current = includeChildren ? index.parents.get(current) : undefined
  ) {
    if (current === id) return true;
  }
  return false;
};

/**
 * The reactions that satisfy the constraints of a selection.
 *
 * Every part of the selection is a constraint. The options of a part of the
 * selection are the choices that are still possible when all other
 * constraints hold, which is why the reactions can be matched without one.
 */
class Matcher {
  private constraints: Array<Uint8Array> = [];
  private matches = new Map<Uint8Array | undefined, Array<IndexedReaction>>();

  readonly consumes: Array<Uint8Array | undefined>;
  readonly produces: Array<Uint8Array | undefined>;
  readonly typeTags?: Uint8Array;
  readonly reversible?: Uint8Array;
  readonly sets?: Uint8Array;

  constructor(
    private readonly index: ReactionIndex,
    { consumes, produces, typeTags, reversible, setIds }: Selection,
  ) {
    const reactions = index.reactions;

    this.consumes = consumes.map((leaf) =>
      leaf && this.constrain(
        reactions,
        (reaction) =>
          reaction.consumes.some((state) => isSelected(index, state, leaf)),
      )
    );
    this.produces = produces.map((leaf) =>
      leaf && this.constrain(
        reactions,
        (reaction) =>
          reaction.produces.some((state) => isSelected(index, state, leaf)),
      )
    );

    if (typeTags.length > 0) {
      this.typeTags = this.constrain(
        reactions,
        (reaction) => reaction.typeTags.some((tag) => typeTags.includes(tag)),
      );
    }
    if (reversible !== Reversible.Both) {
      const value = reversible === Reversible.True;
      this.reversible = this.constrain(
        reactions,
        (reaction) => reaction.reversible === value,
      );
    }
    if (setIds.length > 0) {
      const wanted = new Set(setIds);
      this.sets = this.constrain(
        reactions,
        (reaction) =>
          reaction.items.some((item) => item.sets.some((id) => wanted.has(id))),
      );
    }
  }

  private constrain(
    reactions: Array<IndexedReaction>,
    holds: (reaction: IndexedReaction) => boolean,
  ) {
    const constraint = new Uint8Array(reactions.length);
    reactions.forEach((reaction, i) => constraint[i] = holds(reaction) ? 1 : 0);
    this.constraints.push(constraint);
    return constraint;
  }

  /**
   * The reactions, in index order, that satisfy all constraints but `skip`.
   *
   * Every empty entry of the selection has no constraint to skip, which makes
   * them all ask for the same reactions.
   */
  match(skip?: Uint8Array): Array<IndexedReaction> {
    let reactions = this.matches.get(skip);
    if (reactions === undefined) {
      const constraints = this.constraints.filter((c) => c !== skip);
      reactions = this.index.reactions.filter((_, i) =>
        constraints.every((c) => c[i])
      );
      this.matches.set(skip, reactions);
    }
    return reactions;
  }
}

/**
 * The tree of the `states`, and of the parents that lead to them.
 *
 * Parents are not selectable themselves, unless they are in `states` as well.
 * The `ignored` states, and everything below them, are left out.
 */
function stateTree(
  index: ReactionIndex,
  states: Set<string>,
  ignored: Set<string>,
): StateTree {
  const summarize = (id: string, depth: number): StateSummary | undefined => {
    if (ignored.has(id)) return undefined;

    const { latex, children } = index.states.get(id)!;
    const valid = states.has(id);

    if (depth === MAX_STATE_DEPTH) {
      return valid ? { latex, valid } : undefined;
    }

    const subtree: StateTree = {};
    for (const child of children) {
      const summary = summarize(child, depth + 1);
      if (summary !== undefined) subtree[child] = summary;
    }

    return valid || Object.keys(subtree).length > 0
      ? { latex, valid, children: subtree }
      : undefined;
  };

  const tree: StateTree = {};
  for (const root of index.roots) {
    const summary = summarize(root, 0);
    if (summary !== undefined) tree[root] = summary;
  }
  return tree;
}

const reversibleChoices = (reactions: Array<IndexedReaction>) => {
  const values = new Set(reactions.map(({ reversible }) => reversible));
  return values.size === 0
    ? []
    : values.size > 1
    ? [Reversible.True, Reversible.False, Reversible.Both]
    : values.has(true)
    ? [Reversible.True, Reversible.Both]
    : [Reversible.False, Reversible.Both];
};

const typeTagChoices = (reactions: Array<IndexedReaction>) => [
  ...new Set(reactions.flatMap(({ typeTags }) => typeTags)),
];

const setChoices = (
  index: ReactionIndex,
  reactions: Array<IndexedReaction>,
) => {
  const available = new Set(
    reactions.flatMap(({ items }) => items.flatMap(({ sets }) => sets)),
  );

  const tree: CSSetTree = {};
  for (const set of index.sets) {
    if (!available.has(set.id)) continue;

    tree[set.organizationId] ??= { name: set.organizationName, sets: {} };
    tree[set.organizationId].sets[set.id] = set.name;
  }
  return tree;
};

/** What the user can choose in each part of a reaction, given what is selected. */
export function reactionOptions(
  index: ReactionIndex,
  selection: Selection,
): ReactionOptions {
  const matcher = new Matcher(index, selection);

  const slotTree = (
    side: "consumes" | "produces",
    slot: number,
  ) => {
    const reactions = matcher.match(matcher[side][slot]);
    const states = new Set(reactions.flatMap((reaction) => reaction[side]));
    const ignored = new Set(
      selection[side].flatMap((leaf, other) =>
        leaf && other !== slot ? [leaf.id] : []
      ),
    );
    return stateTree(index, states, ignored);
  };

  return {
    consumes: selection.consumes.map((_, slot) => slotTree("consumes", slot)),
    produces: selection.produces.map((_, slot) => slotTree("produces", slot)),
    typeTags: typeTagChoices(matcher.match(matcher.typeTags)),
    reversible: reversibleChoices(matcher.match(matcher.reversible)),
    set: setChoices(index, matcher.match(matcher.sets)),
  };
}

/**
 * The ids of the cross sections that match the selection.
 *
 * A cross section matches when its reaction does, and, if sets are selected,
 * when it is in one of them.
 */
export function itemIds(index: ReactionIndex, selection: Selection) {
  const wanted = new Set(selection.setIds);

  return new Matcher(index, selection).match().flatMap(({ items }) =>
    items
      .filter(({ sets }) =>
        wanted.size === 0 || sets.some((id) => wanted.has(id))
      )
      .map(({ id }) => id)
  );
}

const itemKey = (id: string) => id.slice(id.indexOf("/") + 1);

/**
 * Orders the ids of cross sections (`CrossSection/<key>`) by their key, which
 * is the order in which they were loaded.
 */
export function compareItemIds(a: string, b: string) {
  const [x, y] = [itemKey(a), itemKey(b)];
  const difference = Number(x) - Number(y);

  return Number.isNaN(difference) || difference === 0
    ? (x < y ? -1 : x > y ? 1 : 0)
    : difference;
}

/**
 * The ids of the cross sections that match any of the selections, for each set
 * that has any, in the order of the sets in the index.
 *
 * The ids of a set are unique, and ordered as `compareItemIds` does. A cross
 * section that is in several sets is listed in each of them. If a selection
 * has selected sets, it only matches cross sections in those sets.
 */
export function itemsBySet(
  index: ReactionIndex,
  selections: Array<Selection>,
) {
  const items = new Map<string, Set<string>>();

  for (const selection of selections) {
    const wanted = new Set(selection.setIds);

    for (const reaction of new Matcher(index, selection).match()) {
      for (const { id, sets } of reaction.items) {
        for (const set of sets) {
          if (wanted.size > 0 && !wanted.has(set)) continue;

          const ids = items.get(set) ?? new Set<string>();
          ids.add(id);
          items.set(set, ids);
        }
      }
    }
  }

  return index.sets.flatMap(({ id: setId }) => {
    const ids = items.get(setId);
    return ids === undefined
      ? []
      : [{ setId, itemIds: [...ids].sort(compareItemIds) }];
  });
}
