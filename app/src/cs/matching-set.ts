// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CrossSectionSetHeading } from "@lxcat/database/item";

/** A set that has cross sections that match a search. */
export type MatchingSet = CrossSectionSetHeading & {
  /** The number of cross sections in the set that match. */
  nrItems: number;
};
