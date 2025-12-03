// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { string } from "zod";
import { registerType } from "../../common/util.js";
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

registerType(AtomUnspecified.plain, { id: "AtomUnspecified" });
