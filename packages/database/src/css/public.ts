// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ReactionTypeTag } from "@lxcat/schema/process";
import { CrossSectionItem } from "../cs/public.js";
import { StateChoices } from "../shared/queries/state.js";
import { CrossSectionSet } from "./collections.js";

export interface CrossSectionSetHeading {
  id: string;
  name: string;
}

export type OrphanedCrossSectionItem = Omit<CrossSectionItem, "isPartOf">;

export interface CrossSectionSetItem extends CrossSectionSet {
  id: string;
  processes: OrphanedCrossSectionItem[];
  // contributor string is stored in Organization db collection and CrossSectionSet collection has foreign key to it.
  // in current lxcat is called a database
  contributor: string;
}

export type KeyedSet = { _key: string } & CrossSectionSet;

export interface FilterOptions {
  contributor: string[];
  state: StateChoices;
  tag: ReactionTypeTag[];
}

export interface SortOptions {
  field: "name" | "contributor";
  dir: "ASC" | "DESC";
}
