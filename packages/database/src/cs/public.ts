// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type Reference } from "@lxcat/schema/dist/common/reference";
import { type SelfReference } from "@lxcat/schema/dist/document";
import { type Reaction } from "@lxcat/schema/dist/process/reaction";
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

type CrossSectionBagItem = {
  id: string;
  isPartOf: string[];
  reaction: Reaction<string>;
  reference: string[];
} & Pick<CrossSection, "info">;

export type CrossSectionBag = {
  states: Record<string, State>;
  references: Record<string, Reference>;
  sets: Record<string, Omit<CrossSectionSet, "versionInfo">>;
  processes: CrossSectionBagItem[];
} & SelfReference;
