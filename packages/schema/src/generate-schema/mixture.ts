// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import zodToJsonSchema from "zod-to-json-schema";
import { CSLData } from "../common/csl/data";
import { CSLDateVariable } from "../common/csl/date-variable";
import { CSLNameVariable } from "../common/csl/name-variable";
import { LTPMixture } from "../mixture";
import { AnySpecies } from "../state/species";

export const LTPMixtureSchema = zodToJsonSchema(LTPMixture, {
  definitions: { CSLData, CSLNameVariable, CSLDateVariable, AnySpecies },
  $refStrategy: "none",
});

console.log(JSON.stringify(LTPMixtureSchema, null, 2));
