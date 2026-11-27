// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type Reaction } from "@lxcat/schema/process";
import { aql } from "arangojs";
import { Cursor } from "arangojs/cursors";
import { LXCatDatabase } from "../../lxcat-database.js";

type ReactionSide = Array<{ state: string; count: number }>;

// Compare the sides of two reactions as multisets: entries can repeat
// (a reaction can consume or produce the same state more than once), so
// `ALL IN` alone is not enough.
const sameMultiset = (one: ReactionSide, two: ReactionSide) => {
  if (one.length !== two.length) {
    return false;
  }

  const key = (entry: { state: string; count: number }) =>
    `${entry.state}/${entry.count}`;

  const seen = new Map<string, number>();
  for (const entry of one) {
    seen.set(key(entry), (seen.get(key(entry)) ?? 0) + 1);
  }
  for (const entry of two) {
    const n = seen.get(key(entry));
    if (n === undefined || n === 0) {
      return false;
    }
    seen.set(key(entry), n - 1);
  }

  return true;
};

export async function findReactionId(
  this: LXCatDatabase,
  reaction: Reaction<string>,
) {
  // TODO Optimize naive query, instead of denormalizing every reaction in db
  //      and comparing it to the query reaction do something more efficient.
  const cursor: Cursor<{ _id: string; lhs: ReactionSide; rhs: ReactionSide }> =
    await this.db.query(aql`
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
                AND LENGTH(r.typeTags) == LENGTH(${reaction.typeTags})
                AND r.typeTags ALL IN ${reaction.typeTags}
                AND LENGTH(lhs) == LENGTH(${reaction.lhs})
                AND lhs ALL IN ${reaction.lhs}
                AND LENGTH(rhs) == LENGTH(${reaction.rhs})
                AND rhs ALL IN ${reaction.rhs}
                SORT r._id
                RETURN {_id: r._id, lhs, rhs}
        `);
  const candidates = await cursor.all();

  // The filters above are set membership, which cannot tell a reaction
  // like Ar + Ar + e apart from Ar + e + e, so compare the multiplicity
  // of every entry here.
  return candidates.find((candidate) =>
    sameMultiset(candidate.lhs, reaction.lhs)
    && sameMultiset(candidate.rhs, reaction.rhs)
  )?._id;
}
