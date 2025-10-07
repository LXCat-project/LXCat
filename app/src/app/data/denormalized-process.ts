// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Contributor, SetHeader } from "@lxcat/schema";
import type {
  CrossSectionInfo,
  RateCoefficientInfo,
  Reaction,
} from "@lxcat/schema/process";
import { ReferenceRef } from "@lxcat/schema/reference";
import { SerializedSpecies } from "@lxcat/schema/species";

export type DenormalizedProcess = {
  reaction: Reaction<SerializedSpecies>;
  info:
    | CrossSectionInfo<ReferenceRef<string>> & {
      _key: string;
      isPartOf: Array<SetHeader<Contributor>>;
    }
    | RateCoefficientInfo<ReferenceRef<string>> & {
      _key: string;
      isPartOf: Array<SetHeader<Contributor>>;
    };
};
