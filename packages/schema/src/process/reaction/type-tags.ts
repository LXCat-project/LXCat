// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { enum as zEnum, TypeOf } from "zod";

export const ReactionTypeTag = zEnum([
  "Elastic",
  "Effective",
  "Electronic",
  "Vibrational",
  "Rotational",
  "Attachment",
  "Ionization",
  "Recombination",
  "Radiative",
  "Quenching",
  "Chemistry",
]);
export type ReactionTypeTag = TypeOf<typeof ReactionTypeTag>;
