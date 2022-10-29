import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { Reaction } from "@lxcat/schema/dist/core/reaction";
import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { db } from "../../db";

export async function findReactionId(reaction: Reaction<string>) {
  // TODO optimize naive query,
  // instead of denormalizing every reaction in db and comparing it to the query reaction
  // do something more efficient
  const cursor: ArrayCursor<string> = await db().query(aql`
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
                AND r.type_tags ALL IN ${reaction.type_tags}
                AND lhs ALL IN ${reaction.lhs}
                AND rhs ALL IN ${reaction.rhs}
                LIMIT 1 // Stop when found
                RETURN r._id
        `);
  return cursor.next();
}
