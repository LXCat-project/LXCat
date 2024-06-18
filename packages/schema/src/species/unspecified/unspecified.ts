// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { SpeciesBase } from "../composition/species-base.js";
import { Composition } from "../composition/universal.js";
import { typeTag } from "../generators.js";

export const Unspecified = typeTag("Unspecified")
  .merge(SpeciesBase(Composition))
  .merge(z.object({ electronic: z.string().min(1) }));
export type Unspecified = z.infer<typeof Unspecified>;
