// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Reference, SelfReference } from "@lxcat/schema";
import { type Reaction } from "@lxcat/schema/process";
import { CrossSection } from "../cs/collections";
import { CrossSectionSet } from "../css/collections";
import { State } from "../shared/types/collections";

export interface CrossSectionHeading {
  id: string;
  isPartOf: (Omit<CrossSectionSet, "publishedIn"> & {
    id: string;
    publishedIn?: Reference;
  })[];
  reaction: Reaction<State>;
  reference: Reference[];
  // TODO add CrossSection.threshold? Is it useful when searching for a section?
}

export type CrossSectionItem =
  & {
    id: string;
    isPartOf: Array<CrossSectionSet & { id: string }>;
    reaction: Reaction<State>;
    reference: Reference[];
  }
  & Omit<CrossSection, "reaction">
  & SelfReference;
