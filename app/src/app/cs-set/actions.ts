// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { db } from "@lxcat/database";
import { Element } from "@lxcat/schema/species";
import { PeriodicSearchResult } from "../../../../packages/database/dist/elements/queries";

export const getSetHeaderAction = async (
  elements: Array<Element>,
): Promise<Array<PeriodicSearchResult>> =>
  db().getSetHeaderByElements(elements);
