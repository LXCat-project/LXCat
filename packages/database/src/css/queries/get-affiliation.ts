// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { LXCatDatabase } from "../../lxcat-database.js";

export async function getSetAffiliation(
  this: LXCatDatabase,
  key: string,
): Promise<string | undefined> {
  const query = aql`
    FOR set IN CrossSectionSet
      FILTER set._key == ${key}
      FOR org IN Organization
        FILTER org._id == set.organization
        RETURN org.name
  `;

  const cursor: ArrayCursor<string> = await this.db.query(query);
  return cursor.next();
}
