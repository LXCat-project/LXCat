// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";

export const ReactionTypeTag = z.enum([
  "Elastic",
  "Effective",
  "Electronic",
  "Vibrational",
  "Rotational",
  "Attachment",
  "Ionization",
]);
