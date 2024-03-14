// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { zodToJsonSchema } from "zod-to-json-schema";
import { CSLData } from "../common/csl/data.js";
import { CSLDateVariable } from "../common/csl/date-variable.js";
import { CSLNameVariable } from "../common/csl/name-variable.js";
import { Key } from "../key.js";
import { LTPMixture } from "../mixture.js";
import {
  AnySpecies,
  SerializedSpecies,
  StateSummary,
} from "../species/index.js";
import { VersionInfo } from "../version-info.js";

export const LTPMixtureJSONSchema = zodToJsonSchema(LTPMixture, {
  definitions: {
    Key,
    VersionInfo,
    CSLData,
    CSLNameVariable,
    CSLDateVariable,
    AnySpecies,
    ...Object.fromEntries(AnySpecies.optionsMap),
    StateSummary,
    SerializedSpecies,
  },
  $refStrategy: "root",
});
