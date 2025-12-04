// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { object, optional, output, string } from "zod";
import { registerType } from "../../common/util.js";
import { SpeciesBase } from "../composition/species-base.js";
import { Composition } from "../composition/universal.js";
import { typeTag } from "../generators.js";

export const Unspecified = object({
  ...typeTag("Unspecified").shape,
  ...SpeciesBase(Composition).shape,
  electronic: optional(string().min(1)),
});

export type Unspecified = output<typeof Unspecified>;

registerType(Unspecified, { id: "Unspecified" });
