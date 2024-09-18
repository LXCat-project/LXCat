// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Reference } from "@lxcat/schema";
import { type Reaction } from "@lxcat/schema/process";
import { SerializedSpecies } from "@lxcat/schema/species";
import { CrossSectionSet } from "../css/collections.js";

export interface CrossSectionHeading {
  id: string;
  isPartOf: (Omit<CrossSectionSet, "publishedIn"> & {
    id: string;
    publishedIn?: Reference;
  })[];
  reaction: Reaction<SerializedSpecies>;
  reference: Reference[];
  threshold: number;
}
