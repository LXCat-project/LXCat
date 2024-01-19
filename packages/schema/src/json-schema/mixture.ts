// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { zodToJsonSchema } from "zod-to-json-schema";
import { CSLData } from "../common/csl/data.js";
import { CSLDateVariable } from "../common/csl/date-variable.js";
import { CSLNameVariable } from "../common/csl/name-variable.js";
import { Constant, Expression, LUT } from "../common/data-types.js";
import { LTPMixture } from "../mixture.js";
import { CrossSectionData } from "../process/cross-section/data-types.js";
import { RateCoefficientData } from "../process/rate-coefficient/data-types.js";
import { SetHeader } from "../set-header.js";
import { AnySpecies } from "../species/index.js";

export const LTPMixtureJSONSchema = zodToJsonSchema(LTPMixture, {
  definitions: {
    SetHeader,
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
