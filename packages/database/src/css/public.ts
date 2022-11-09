// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CrossSectionItem } from "../cs/public";
import { CrossSectionSet } from "./collections";

export interface CrossSectionSetHeading {
  id: string;
  name: string;
}

export type OrphanedCrossSectionItem = Omit<CrossSectionItem, "isPartOf">;

export interface CrossSectionSetItem extends CrossSectionSet {
  id: string;
  processes: OrphanedCrossSectionItem[];
  // contributor string is stored in Organization db collection and CrossSectionSet collection has foreign key to it.
  // in current lxcat is called a database
  contributor: string;
}
