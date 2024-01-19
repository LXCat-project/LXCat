// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { zodToJsonSchema } from "zod-to-json-schema";
import { CSLData } from "../common/csl/data.js";
import { CSLDateVariable } from "../common/csl/date-variable.js";
import { CSLNameVariable } from "../common/csl/name-variable.js";
import { Constant, Expression, LUT } from "../common/data-types.js";
import { Key } from "../key.js";
import { LTPMixture } from "../mixture.js";
import { CrossSectionData } from "../process/cross-section/data-types.js";
import { RateCoefficientData } from "../process/rate-coefficient/data-types.js";
import { SetHeader } from "../set-header.js";
import { AtomComposition } from "../species/composition/atom.js";
import { HeteronuclearDiatomComposition } from "../species/composition/diatom/heteronuclear.js";
import { HomonuclearCompositionDescriptor } from "../species/composition/diatom/homonuclear.js";
import { Element } from "../species/composition/element.js";
import { LTICComposition } from "../species/composition/triatom/ltic.js";
import { Composition } from "../species/composition/universal.js";
import {
  AnySpecies,
  SerializedSpecies,
  StateSummary,
  SummarizedComponent,
} from "../species/index.js";
import { VersionInfo } from "../version-info.js";

export const LTPMixtureJSONSchema = zodToJsonSchema(LTPMixture, {
  definitions: {
    Key,
    VersionInfo,
    SetHeader,
    CSLData,
    CSLNameVariable,
    CSLDateVariable,
    Element,
    Composition,
    HomonuclearCompositionDescriptor,
    HeteronuclearDiatomComposition,
    LTICComposition,
    AtomComposition,
    Constant,
    LUT,
    Expression,
    CrossSectionData,
    RateCoefficientData,
    AnySpecies,
    ...Object.fromEntries(AnySpecies.optionsMap),
    SummarizedComponent,
    StateSummary,
    SerializedSpecies,
  },
  $refStrategy: "root",
});
