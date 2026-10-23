// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Reversible, StateProcess } from "@lxcat/database/item/picker";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { z } from "zod";

export const stateLeafSchema = z.object({
  id: z.string(),
  includeChildren: z.boolean(),
});

export const stateProcessSchema = z.enum(StateProcess);

export const reactionSelectionSchema = z.object({
  consumes: z.array(stateLeafSchema),
  produces: z.array(stateLeafSchema),
  typeTags: z.array(ReactionTypeTag),
  reversible: z.enum(Reversible),
  setIds: z.array(z.string()),
});

export type ReactionSelection = z.infer<typeof reactionSelectionSchema>;

const statePathSchema = z.object({
  particle: z.string().optional(),
  electronic: z.string().optional(),
  vibrational: z.string().optional(),
  rotational: z.string().optional(),
});

export const reactionTemplateSchema = z.object({
  consumes: z.array(statePathSchema),
  produces: z.array(statePathSchema),
  reversible: z.enum(Reversible),
  typeTags: z.array(ReactionTypeTag),
  set: z.array(z.string()),
});
