// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ReactionTypeTag } from "@lxcat/schema/process";
import { StateChoices } from "../shared/queries/state.js";
import { CrossSectionSet } from "./collections.js";

export interface CrossSectionSetHeading {
  id: string;
  name: string;
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
