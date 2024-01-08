// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { zodToJsonSchema } from "zod-to-json-schema";
import { CSLData } from "../common/csl/data.js";
import { CSLDateVariable } from "../common/csl/date-variable.js";
import { CSLNameVariable } from "../common/csl/name-variable.js";
import { LTPDocument } from "../document.js";
import { AnySpecies } from "../species/index.js";

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
