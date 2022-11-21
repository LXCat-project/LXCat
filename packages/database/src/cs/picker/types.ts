// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { AqlLiteral, GeneratedAqlQuery } from "arangojs/aql";
import { StatePath } from "../../shared/getStateLeaf";
import { StateTree } from "../../shared/queries/state";

export interface ReactionTemplate {
  consumes: StatePath[];
  produces: StatePath[];
  reversible: Reversible;
  typeTags: ReactionTypeTag[];
  set: string[];
}

export interface NestedStateArray {
  id: string;
  latex: string;
  valid: boolean;
  children?: Array<NestedStateArray>;
}

export enum StateProcess {
  Consumed = "Consumes",
  Produced = "Produces",
}

export type ReactionFunction = (reaction: AqlLiteral) => GeneratedAqlQuery;

// TODO: sets can possibly be an array of objects.
interface OrganizationSummary {
  name: string;
  sets: Record<string, string>;
}
export type CSSetTree = Record<string, OrganizationSummary>;

export type ReactionChoices = {
  consumes: StateTree[];
  produces: StateTree[];
  typeTags: ReactionTypeTag[];
  reversible: Reversible[];
  set: CSSetTree;
};

export interface Facets {
  reactions: ReactionChoices[];
}

export enum Reversible {
  True = "true",
  False = "false",
  Both = "both",
}
