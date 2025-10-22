// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { globalRegistry, object, optional, string, TypeOf } from "zod";
import { SpeciesBase } from "../composition/species-base.js";
import { Composition } from "../composition/universal.js";
import { typeTag } from "../generators.js";

export const Unspecified = typeTag("Unspecified")
  .merge(SpeciesBase(Composition))
  .merge(object({ electronic: optional(string().min(1)) }));
export type Unspecified = TypeOf<typeof Unspecified>;

globalRegistry.add(Unspecified, { id: "Unspecified" });
