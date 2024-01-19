// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { zodToJsonSchema } from "zod-to-json-schema";
import { CSLData } from "../common/csl/data.js";
import { CSLDateVariable } from "../common/csl/date-variable.js";
import { CSLNameVariable } from "../common/csl/name-variable.js";
import { Constant, Expression, LUT } from "../common/data-types.js";
import { Key } from "../key.js";
import { NewLTPDocument } from "../new-document.js";
import { CrossSectionData } from "../process/cross-section/data-types.js";
import { RateCoefficientData } from "../process/rate-coefficient/data-types.js";
import { AnySpecies, Composition, Element } from "../species/index.js";
import { VersionInfo } from "../version-info.js";
import { VersionedLTPDocument } from "../versioned-document.js";

export const VersionedLTPDocumentJSONSchema = zodToJsonSchema(
  VersionedLTPDocument,
  {
    definitions: {
      Key,
      VersionInfo,
      CSLData,
      CSLNameVariable,
      CSLDateVariable,
      Element,
      Composition,
      Constant,
      LUT,
      Expression,
      CrossSectionData,
      RateCoefficientData,
      AnySpecies,
      ...Object.fromEntries(AnySpecies.optionsMap),
    },
    $refStrategy: "root",
  },
);

export const NewLTPDocumentJSONSchema = zodToJsonSchema(NewLTPDocument, {
  definitions: {
    Key,
    VersionInfo,
    CSLData,
    CSLNameVariable,
    CSLDateVariable,
    Element,
    Composition,
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
