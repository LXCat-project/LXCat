// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Reference, SelfReference } from "@lxcat/schema";
import { type Reaction } from "@lxcat/schema/process";
import { SerializedSpecies } from "@lxcat/schema/species";
import { CrossSection } from "../cs/collections.js";
import { CrossSectionSet } from "../css/collections.js";

export interface CrossSectionHeading {
  id: string;
  isPartOf: (Omit<CrossSectionSet, "publishedIn"> & {
    id: string;
    publishedIn?: Reference;
  })[];
  reaction: Reaction<SerializedSpecies>;
  reference: Reference[];
  // TODO add CrossSection.threshold? Is it useful when searching for a section?
}

export type CrossSectionItem =
  & {
    id: string;
    isPartOf: Array<CrossSectionSet & { id: string }>;
    reaction: Reaction<SerializedSpecies>;
    reference: Reference[];
  }
  & Omit<CrossSection, "reaction">
  & SelfReference;
