// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { literal, number, object } from "zod";
import { AtomComposition } from "../composition/atom.js";

export const Atom = object({
  type: literal("Atom"),
  composition: AtomComposition,
  charge: number().int(),
});
