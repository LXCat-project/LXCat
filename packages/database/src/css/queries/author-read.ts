// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Key, VersionedLTPDocument, VersionInfo } from "@lxcat/schema";
import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { boolean, object, string } from "zod";
import { LXCatDatabase } from "../../lxcat-database.js";
// import { KeyedSet } from "../public.js";

const KeyedSet = object({
  _key: Key,
  name: string(),
  description: string(),
  publishedIn: string().optional(),
  complete: boolean(),
  organization: string(),
  versionInfo: VersionInfo,
});

export async function listOwnedSets(this: LXCatDatabase, email: string) {
  const cursor: ArrayCursor<unknown> = await this.db.query(aql`
    FOR u IN users
        FILTER u.email == ${email}
        LIMIT 1
        FOR o IN OUTBOUND u MemberOf
            FOR css IN CrossSectionSet
                FILTER css.organization == o._id
                FILTER css.versionInfo.status != 'archived'
                
                LET with_draft = FIRST(
                    FILTER css.versionInfo.status == 'published'
                    RETURN COUNT(
                        FOR css_draft IN INBOUND css CrossSectionSetHistory
                            LIMIT 1
                            return 1
                    )
                )
                
                FILTER with_draft != 1
                    return MERGE(UNSET(css, ["_rev", "_id"]), {organization: o.name})
    `);
  return cursor.all().then((sets) => sets.map((set) => KeyedSet.parse(set)));
}

export async function byOwnerAndId(
  this: LXCatDatabase,
  email: string,
  id: string,
) {
  const cursor: ArrayCursor<unknown> = await this.db.query(aql`
            FOR user IN users
              FILTER user.email == ${email}
              FOR org IN OUTBOUND user MemberOf
            FOR css IN CrossSectionSet
              FILTER css._key == ${id}
              FILTER org._id == css.organization
              FILTER ['published', 'draft', 'retracted'] ANY == css.versionInfo.status
              LET references = MERGE(
                FOR cs IN INBOUND css IsPartOf
                  FOR ref IN OUTBOUND cs References
                    RETURN {[ref._key]: UNSET(ref, ["_key", "_rev", "_id"])}
              )
              LET states = MERGE(
                FOR cs IN INBOUND css IsPartOf
                  FOR r IN Reaction
                    FILTER r._id == cs.reaction
                    LET consumes = (
                      FOR state IN OUTBOUND r Consumes
                        LET composition = FIRST(
                          FOR co IN Composition
                            FILTER state.detailed.composition == co._id
                            return co.definition
                        )
                        RETURN {[state._key]: {
                          detailed: MERGE_RECURSIVE(state.detailed, {composition}), 
                          serialized: state.serialized
                        }}
                    )
                    LET produces = (
                      FOR state IN OUTBOUND r Produces
                        LET composition = FIRST(
                          FOR co IN Composition
                            FILTER state.detailed.composition == co._id
                            return co.definition
                        )
                        RETURN {[state._key]: {
                          detailed: MERGE_RECURSIVE(state.detailed, {composition}), 
                          serialized: state.serialized
                        }}
                    )
                    RETURN MERGE(UNION(produces, consumes))
              )
              LET processes = (
                FOR cs IN INBOUND css IsPartOf
                  LET csRefs = (
                    FOR r, rs IN OUTBOUND cs References
                      RETURN HAS(rs, "comments") ? { id: r._key, comments: rs.comments } : r._key
                  )
                  LET reaction = FIRST(
                    FOR r in Reaction
                      FILTER r._id == cs.reaction
                      LET lhs = (
                        FOR state, e IN OUTBOUND r Consumes
                          RETURN {state: state._key, count: e.count}
                      )
                      LET rhs = (
                        FOR state, e IN OUTBOUND r Produces
                          RETURN {state: state._key, count: e.count}
                      )
                      RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), {lhs, rhs})
                  )
                  RETURN {
                    reaction,
                    info: [MERGE({ _key: cs._key, versionInfo: cs.versionInfo, references: csRefs }, cs.info)]
                  }
              )
              RETURN MERGE(UNSET(css, ["_rev", "_id", "organization"]), {contributor: UNSET(org, ["_id", "_key", "_rev"]), references, states, processes})
    `);
  return await cursor.next().then((doc) =>
    doc ? VersionedLTPDocument.parse(doc) : null
  );
}

/**
 * Checks whether set with key is owned by user with email.
 */
export async function isOwnerOfSet(
  this: LXCatDatabase,
  key: string,
  email: string,
) {
  const cursor: ArrayCursor<boolean> = await this.db.query(aql`
    FOR u IN users
        FILTER u.email == ${email}
        FOR o IN OUTBOUND u MemberOf
            FOR css IN CrossSectionSet
                FILTER css._key == ${key}
                FILTER css.organization == o._id
                RETURN true
  `);
  return cursor.hasNext;
}

export async function getVersionInfo(this: LXCatDatabase, key: string) {
  const cursor: ArrayCursor<unknown> = await this.db.query(aql`
    FOR css IN CrossSectionSet
        FILTER css._key == ${key}
        RETURN css.versionInfo
  `);
  return cursor.next().then((info) =>
    info !== undefined ? VersionInfo.parse(info) : undefined
  );
}
