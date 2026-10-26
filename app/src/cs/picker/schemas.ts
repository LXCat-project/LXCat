// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Reversible } from "@lxcat/database/item/picker";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { z } from "zod";

// Every entry of a template costs the database work, and templates come from
// the URL and from public server actions, so they are limited generously.
const MAX_STATES_PER_SIDE = 10;
const MAX_REACTIONS = 20;
const MAX_SETS = 1000;

const id = z.string().max(100);

const statePathSchema = z.object({
  particle: id.optional(),
  electronic: id.optional(),
  vibrational: id.optional(),
  rotational: id.optional(),
});

export const reactionTemplateSchema = z.object({
  consumes: z.array(statePathSchema).max(MAX_STATES_PER_SIDE),
  produces: z.array(statePathSchema).max(MAX_STATES_PER_SIDE),
  reversible: z.enum(Reversible),
  typeTags: z.array(ReactionTypeTag).max(ReactionTypeTag.options.length),
  set: z.array(id).max(MAX_SETS),
});

export const reactionTemplatesSchema = z.array(reactionTemplateSchema).max(
  MAX_REACTIONS,
);
