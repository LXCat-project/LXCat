// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor.js";
import { LXCatDatabase } from "../../lxcat-database.js";

export async function getNumItemsInSet(
  this: LXCatDatabase,
  key: string,
): Promise<number | undefined> {
  const query = aql`
    FOR set IN CrossSectionSet
      FILTER set._key == ${key}
        let count = COUNT(
          FOR cs IN INBOUND set IsPartOf
            RETURN 1
        )
        return count
  `;

  const cursor: ArrayCursor<number> = await this.db.query(query);
  return cursor.next();
}
