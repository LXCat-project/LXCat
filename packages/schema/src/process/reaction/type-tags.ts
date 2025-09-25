// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { enum as zEnum, TypeOf } from "zod";

export const ReactionTypeTag = zEnum([
  "Elastic",
  "Effective",
  "MomentumTransfer",
  "Excitation",
  "Electronic",
  "Vibrational",
  "Rotational",
  "Attachment",
  "Ionization",
  "Dissociative",
  "Recombination",
  "Association",
  "Dissociation",
  "Exchange",
]);
export type ReactionTypeTag = TypeOf<typeof ReactionTypeTag>;
