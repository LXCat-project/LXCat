// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { SpeciesBase } from "../composition/species-base";
import { Composition } from "../composition/universal";
import { typeTag } from "../generators";

export const Unspecified = typeTag("unspecified")
  .merge(SpeciesBase(Composition))
  .merge(z.object({ electronic: z.string().min(1) }));
export type Unspecified = z.infer<typeof Unspecified>;
