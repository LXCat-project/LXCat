// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { Element } from "@lxcat/schema/species";
import { PeriodicSearchResult } from "../../../../packages/database/dist/elements/queries";

export const getSetHeaderAction = async (
  elements: Array<Element>,
): Promise<Array<PeriodicSearchResult>> => {
  // NOTE: Import `@lxcat/database` dynamically, as a static import resulted in
  // a runtime `TypeError`.
  const { db } = await import("@lxcat/database");
  return db().getSetHeaderByElements(elements);
};
