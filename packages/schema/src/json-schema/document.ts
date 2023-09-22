// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import zodToJsonSchema from "zod-to-json-schema";
import { CSLData } from "../common/csl/data";
import { CSLDateVariable } from "../common/csl/date-variable";
import { CSLNameVariable } from "../common/csl/name-variable";
import { LTPDocument } from "../document";
import { AnySpecies } from "../species";

export const LTPDocumentJSONSchema = zodToJsonSchema(LTPDocument, {
  definitions: {
    CSLData,
    CSLNameVariable,
    CSLDateVariable,
    AnySpecies,
    ...Object.fromEntries(AnySpecies.optionsMap),
  },
  $refStrategy: "none",
});
