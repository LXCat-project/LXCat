// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { globalRegistry, string } from "zod";
import { makeComponent } from "../component.js";
import { AtomComposition } from "../composition/atom.js";
import { SpeciesBase } from "../composition/species-base.js";
import { makeAtom } from "../generators.js";

const UnspecifiedComponent = makeComponent(
  string().min(1),
  (comp) => comp,
  (comp) => `\\mathrm{${comp}}`,
);

export const AtomUnspecified = makeAtom(
  "AtomUnspecified",
  SpeciesBase(AtomComposition),
  UnspecifiedComponent,
);

globalRegistry.add(AtomUnspecified.plain, { id: "AtomUnspecified" });
