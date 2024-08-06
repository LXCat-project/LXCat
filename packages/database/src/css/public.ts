// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CrossSectionSet } from "./collections.js";

export interface CrossSectionSetHeading {
  id: string;
  name: string;
}

export type KeyedSet = { _key: string } & CrossSectionSet;

export interface SortOptions {
  field: "name" | "contributor";
  dir: "ASC" | "DESC";
}
