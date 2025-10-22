// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { globalRegistry, literal, number, object } from "zod";
import { AtomComposition } from "../composition/atom.js";

export const Atom = object({
  type: literal("Atom"),
  composition: AtomComposition,
  charge: number().int(),
});

globalRegistry.add(Atom, { id: "Atom" });
