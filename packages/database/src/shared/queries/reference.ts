// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";

import { db } from "../../db";
import { Reference } from "../types/collections";

export const getReferences = async (
  ids: Array<string>,
): Promise<Array<Reference>> => {
  const cursor: ArrayCursor<Reference> = await db().query(aql`
            FOR ref IN Reference
              FILTER ref._key IN ${ids}
              RETURN UNSET(ref, ["_key", "_id", "_rev"])
        `);
  return cursor.all();
};
