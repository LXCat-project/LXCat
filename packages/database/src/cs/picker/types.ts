// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type ReactionTypeTag } from "@lxcat/schema/process";
import { StatePath } from "../../shared/get-state-leaf.js";
import { StateTree } from "../../shared/types/state.js";
import { CrossSectionSetHeading } from "../public.js";

export interface ReactionTemplate {
  consumes: StatePath[];
  produces: StatePath[];
  reversible: Reversible;
  typeTags: ReactionTypeTag[];
  set: string[];
}

// TODO: sets can possibly be an array of objects.
interface OrganizationSummary {
  name: string;
  sets: Record<string, string>;
}
export type CSSetTree = Record<string, OrganizationSummary>;

/** A set that has cross sections that match a search. */
export type MatchingSet = CrossSectionSetHeading & {
  /** The number of cross sections in the set that match. */
  nrItems: number;
};

export type ReactionOptions = {
  consumes: StateTree[];
  produces: StateTree[];
  typeTags: ReactionTypeTag[];
  reversible: Reversible[];
  set: CSSetTree;
};

export type SearchOptions = Array<ReactionOptions>;

export enum Reversible {
  True = "true",
  False = "false",
  Both = "both",
}

export interface IndexedItem {
  /** Key of the cross section. */
  key: string;
  /** Keys of the published sets that contain the cross section. */
  sets: Array<string>;
}

export interface IndexedReaction {
  /** Keys of the consumed states. */
  consumes: Array<string>;
  /** Keys of the produced states. */
  produces: Array<string>;
  typeTags: Array<ReactionTypeTag>;
  reversible: boolean;
  /** The cross sections of this reaction that are in a published set. */
  items: Array<IndexedItem>;
}

export interface IndexedState {
  /** The LaTeX of the state at its own level of the state tree. */
  latex: string;
  /** The child states that are in the index, in the order of the database. */
  children: Array<string>;
}

export interface IndexedSet {
  key: string;
  name: string;
  organizationKey: string;
  organizationName: string;
}

/**
 * What the reaction picker needs to know about the published data.
 *
 * Every list has the order in which the database returns its documents,
 * because that is the order in which the picker shows them. The options are
 * records, which list keys that are integers, as the keys of ArangoDB are for
 * now, in ascending order, so the order of an option is not that of its list.
 */
export interface ReactionIndex {
  /** The reactions that have a cross section in a published set. */
  reactions: Array<IndexedReaction>;
  /** The states in the state tree, that is, up to rotational level. */
  states: Map<string, IndexedState>;
  /** The particles, which are the top level of the state tree. */
  roots: Array<string>;
  /** The parent state of every child state. */
  parents: Map<string, string>;
  /** The published sets, in the order of the database. */
  sets: Array<IndexedSet>;
}

/** The deepest level of the state tree: particle, electronic, vibrational, rotational. */
export const MAX_STATE_DEPTH = 3;
