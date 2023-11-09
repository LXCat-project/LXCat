// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { db } from "../../db";
import { KeyedDocument } from "../../schema/document";
import { VersionInfo } from "../../shared/types/version_info";
import { CrossSectionSet } from "../collections";

export interface CrossSectionSetOwned extends CrossSectionSet {
  _key: string;
}

export async function listOwned(email: string) {
  const cursor: ArrayCursor<CrossSectionSetOwned> = await db().query(aql`
    FOR u IN users
        FILTER u.email == ${email}
        LIMIT 1
        FOR m IN MemberOf
            FILTER m._from == u._id
            FOR o IN Organization
                FILTER m._to == o._id
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
  return await cursor.all();
}

export const byId = async (id: string) => {
  const cursor: ArrayCursor<unknown> = await db().query(aql`
            FOR css IN CrossSectionSet
              FILTER css._key == ${id}
              LET contributor = FIRST(
                FOR org IN Organization
                  FILTER org._id == css.organization
                  RETURN org.name
              )
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
                        RETURN {[state._key]: state.detailed}
                    )
                    LET produces = (
                      FOR state IN OUTBOUND r Produces
                        RETURN {[state._key]: state.detailed}
                    )
                    RETURN MERGE(UNION(produces, consumes))
              )
              LET processes = (
                FOR cs IN INBOUND css IsPartOf
                  LET csRefs = (
                    FOR ref IN OUTBOUND cs References
                      RETURN ref._key
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
                    info: MERGE(cs.info, { _key: cs._key, references: csRefs })
                  }
              )
              RETURN MERGE(UNSET(css, ["_rev", "_id", "versionInfo", "organization"]), {contributor, references, states, processes})
        `);
  return cursor.next().then((doc) =>
    doc ? KeyedDocument.parse(doc) : undefined
  );
};

export async function byOwnerAndId(email: string, id: string) {
  const cursor: ArrayCursor<unknown> = await db().query(aql`
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
                        RETURN {[state._key]: state.detailed}
                    )
                    LET produces = (
                      FOR state IN OUTBOUND r Produces
                        RETURN {[state._key]: state.detailed}
                    )
                    RETURN MERGE(UNION(produces, consumes))
              )
              LET processes = (
                FOR cs IN INBOUND css IsPartOf
                  LET csRefs = (
                    FOR ref IN OUTBOUND cs References
                      RETURN ref._key
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
                    info: [MERGE(cs.info, { _key: cs._key, references: csRefs })]
                  }
              )
              RETURN MERGE(UNSET(css, ["_rev", "_id", "versionInfo", "organization"]), {contributor: org.name, references, states, processes})
    `);
  return await cursor.next().then((doc) =>
    doc ? KeyedDocument.parse(doc) : null
  );
}

/**
 * Checks whether set with key is owned by user with email.
 */
export async function isOwner(key: string, email: string) {
  const cursor: ArrayCursor<boolean> = await db().query(aql`
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

export async function getVersionInfo(key: string) {
  const cursor: ArrayCursor<VersionInfo> = await db().query(aql`
    FOR css IN CrossSectionSet
        FILTER css._key == ${key}
        RETURN css.versionInfo
  `);
  return cursor.next();
}
