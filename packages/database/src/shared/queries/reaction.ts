// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type Reaction } from "@lxcat/schema/process";
import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { LXCatDatabase } from "../../lxcat-database";

export async function findReactionId(
  this: LXCatDatabase,
  reaction: Reaction<string>,
) {
  // TODO Optimize naive query, instead of denormalizing every reaction in db
  //      and comparing it to the query reaction do something more efficient.
  const cursor: ArrayCursor<string> = await this.db.query(aql`
            FOR r IN Reaction
                LET lhs = (
                    FOR s IN Consumes
                        FILTER s._from == r._id
                        RETURN {state: s._to, count: s.count}
                )
                LET rhs = (
                    FOR s IN Produces
                        FILTER s._from == r._id
                        RETURN {state: s._to, count: s.count}
                )
                FILTER r.reversible == ${reaction.reversible} 
                AND r.typeTags ALL IN ${reaction.typeTags}
                AND lhs ALL IN ${reaction.lhs}
                AND rhs ALL IN ${reaction.rhs}
                LIMIT 1 // Stop when found
                RETURN r._id
        `);
  return cursor.next();
}
