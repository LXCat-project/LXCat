// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { zodToJsonSchema } from "zod-to-json-schema";
import { CSLData } from "../common/csl/data.js";
import { CSLDateVariable } from "../common/csl/date-variable.js";
import { CSLNameVariable } from "../common/csl/name-variable.js";
import { Constant, Expression, LUT } from "../common/data-types.js";
import { LTPDocument } from "../document.js";
import { CrossSectionData } from "../process/cross-section/data-types.js";
import { RateCoefficientData } from "../process/rate-coefficient/data-types.js";
import { AnySpecies } from "../species/index.js";

export const LTPDocumentJSONSchema = zodToJsonSchema(LTPDocument, {
  definitions: {
    CSLData,
    CSLNameVariable,
    CSLDateVariable,
    Constant,
    LUT,
    Expression,
    CrossSectionData,
    RateCoefficientData,
    AnySpecies,
    ...Object.fromEntries(AnySpecies.optionsMap),
  },
  $refStrategy: "root",
});
