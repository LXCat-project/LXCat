// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { VersionInfo } from "@lxcat/schema";
import { aql } from "arangojs";
import { Cursor } from "arangojs/cursors";
import { LXCatDatabase } from "../../lxcat-database.js";
import { KeyedProcess, OwnedProcess } from "../../schema/process.js";
import { PagingOptions } from "../../shared/types/search.js";

export async function getVersionInfo(this: LXCatDatabase, key: string) {
  const cursor: Cursor<unknown> = await this.db.query(aql`
      FOR cs IN CrossSection
          FILTER cs._key == ${key}
          RETURN cs.versionInfo
    `);
  return cursor.next().then((result) =>
    result === undefined ? undefined : VersionInfo.parse(result)
  );
}

export async function searchOwned(
  this: LXCatDatabase,
  email: string,
  // _options: Array<ReactionTemplate> = defaultSearchTemplate(),
  paging: PagingOptions = { offset: 0, count: 100 },
) {
  const reactionsAql = aql``; // TODO implement
  const limit_aql = aql`LIMIT ${paging.offset}, ${paging.count}`;
  const cursor: Cursor<unknown> = await this.db.query(aql`
    FOR u IN users
      FILTER u.email == ${email}
      FOR o IN OUTBOUND u MemberOf
        FOR cs IN CrossSection
          FILTER cs.organization == o._id
          FILTER ['published' ,'draft', 'retracted'] ANY == cs.versionInfo.status
          LET with_draft = FIRST(
            FILTER cs.versionInfo.status == 'published'
            RETURN COUNT(
              FOR cs_draft IN INBOUND cs CrossSectionHistory
                LIMIT 1
                return 1
            )
          )
          FILTER with_draft != 1
          LET sets = (
            FOR css IN OUTBOUND cs IsPartOf
              RETURN MERGE(UNSET(css, ["_rev", "_id", "versionInfo", "organization"]), { contributor: DOCUMENT(css.organization).name })
          )
          ${reactionsAql}
          LET reaction = FIRST(
            FOR r in Reaction
              FILTER r._id == cs.reaction
              LET consumes = (
                FOR species, c IN OUTBOUND r Consumes
                  LET composition = FIRST(
                    FOR co IN Composition
                      FILTER species.detailed.composition == co._id
                      return co.definition
                  )
                  RETURN {state: MERGE_RECURSIVE(UNSET(species, ["_key", "_rev", "_id"]), {detailed: {composition}}), count: c.count}
              )
              LET produces = (
                FOR species, p IN OUTBOUND r Produces
                  LET composition = FIRST(
                    FOR co IN Composition
                      FILTER species.detailed.composition == co._id
                      return co.definition
                  )
                  RETURN {state: MERGE_RECURSIVE(UNSET(species, ["_key", "_rev", "_id"]), {detailed: {composition}}), count: p.count}
              )
              RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), { lhs: consumes, rhs: produces })
          )
          LET references = (
            FOR r IN OUTBOUND cs References
              RETURN UNSET(r, ["_key", "_rev", "_id"])
          )
          SORT cs.versionInfo.createdOn DESC
          ${limit_aql}
          RETURN { reaction, info: [MERGE(cs.info, { _key: cs._key, versionInfo: cs.versionInfo, references, isPartOf: sets })] }
	`);
  return (await cursor.all()).map((cs) => OwnedProcess.parse(cs));
}

export async function byOwnerAndId(
  this: LXCatDatabase,
  email: string,
  id: string,
) {
  const cursor: Cursor<KeyedProcess<string, string>> = await this
    .db
    .query(aql`
    FOR u IN users
    FILTER u.email == ${email}
    FOR m IN MemberOf
        FILTER m._from == u._id
        FOR o IN Organization
            FILTER m._to == o._id
            FOR cs IN CrossSection
                FILTER cs.organization == o.name
                FILTER cs._key == ${id}
                FILTER ['published' ,'draft', 'retracted'] ANY == cs.versionInfo.status
                LET references = (
                  FOR rs IN References
                      FILTER rs._from == cs._id
                      FOR r IN Reference
                          FILTER r._id == rs._to
                          RETURN r._key
                  )
                LET reaction = FIRST(
                  FOR r in Reaction
                      FILTER r._id == cs.reaction
                      LET consumes2 = (
                          FOR c IN Consumes
                          FILTER c._from == r._id
                              FOR c2s IN State
                              FILTER c2s._id == c._to
                              RETURN {state: c2s._key, count: c.count}
                      )
                      LET produces2 = (
                          FOR p IN Produces
                          FILTER p._from == r._id
                              FOR p2s IN State
                              FILTER p2s._id == p._to
                              RETURN {state: p2s._key, count: p.count}
                      )
                      RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), {"lhs":consumes2}, {"rhs": produces2})
                )
                // RETURN MERGE(UNSET(cs, ["_rev", "_id", "versionInfo", "organization"]), { reaction, references })
                RETURN { reaction, info: [MERGE(cs.info, { _key: cs._key, references })] }
      `);
  return await cursor.next();
}

export async function byOrgAndId(
  this: LXCatDatabase,
  org: string,
  key: string,
) {
  const cursor: Cursor<KeyedProcess<string, string>> = await this
    .db
    .query(aql`
      FOR o IN Organization
        FILTER o.name == ${org}
        FOR cs IN CrossSection
          FILTER cs.organization == o._id
          FILTER cs._key == ${key}
          FILTER ['published' ,'draft', 'retracted'] ANY == cs.versionInfo.status

          LET references = (
            FOR r, rs IN OUTBOUND cs References
              RETURN HAS(rs, "comments") ? { id: r._key, comments: rs.comments } : r._key
          )

          LET reaction = FIRST(
            FOR r in Reaction
              FILTER r._id == cs.reaction
              LET consumes = (
                FOR s, c IN OUTBOUND r Consumes
                  RETURN {state: s._key, count: c.count}
              )
              LET produces = (
                FOR s, p IN OUTBOUND r Produces
                  RETURN {state: s._key, count: p.count}
              )
              RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), {"lhs": consumes}, {"rhs": produces})
          )

          RETURN { reaction, info: [MERGE(cs.info, { _key: cs._key, references })] }
      `);
  return await cursor.next();
}
