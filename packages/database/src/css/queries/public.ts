// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { VersionedLTPDocument, VersionInfo } from "@lxcat/schema";

import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { LXCatDatabase } from "../../lxcat-database.js";
import { CrossSectionSetHeading } from "../public.js";

export async function listSets(this: LXCatDatabase, contributor?: string) {
  const cursor: ArrayCursor<CrossSectionSetHeading> = await this.db.query(aql`
        FOR css IN CrossSectionSet
          FILTER css.versionInfo.status == "published"
          ${
    contributor
      ? aql`FILTER DOCUMENT(css.organization).name == ${contributor}`
      : aql``
  }
          RETURN { id: css._key, name: css.name }
      `);
  return cursor.all();
}

export async function getItemIdsInSet(this: LXCatDatabase, setId: string) {
  const cursor: ArrayCursor<string> = await this.db.query(aql`
      FOR css IN CrossSectionSet
        FILTER css._key == ${setId}
        FOR cs IN INBOUND css IsPartOf
          RETURN cs._key
    `);
  return cursor.all();
}

export async function byId(
  this: LXCatDatabase,
  id: string,
  allowDrafts: boolean = false,
) {
  const cursor: ArrayCursor<unknown> = await this.db.query(aql`
    FOR css IN CrossSectionSet
      FILTER css._key == ${id}
      ${allowDrafts ? aql`` : aql`FILTER css.versionInfo.status != 'draft'`}
      LET pRef = FIRST(
        FOR r IN Reference
          FILTER r._id == css.publishedIn
          RETURN r
      )
      LET procRefs = (
        FOR cs IN INBOUND css IsPartOf
          FOR r IN OUTBOUND cs References
            RETURN {[r._key]: UNSET(r, ["_key", "_rev", "_id"])}
      )
      LET refs = MERGE(
        NOT_NULL(pRef) 
          ? PUSH(procRefs, {[pRef._key]: UNSET(pRef, ["_key", "_rev", "_id"])})
          : procRefs
      )
      LET states = MERGE(
        FOR cs IN INBOUND css IsPartOf
          FOR r in Reaction
            FILTER r._id == cs.reaction
            LET consumes = (
              FOR c IN OUTBOUND r Consumes
                LET composition = FIRST(
                  FOR co IN Composition
                    FILTER c.detailed.composition == co._id
                    return co.definition
                )
                RETURN {[c._key]: {
                  detailed: MERGE_RECURSIVE(c.detailed, {composition}), 
                  serialized: c.serialized
                }}
            )
            LET produces = (
              FOR p IN OUTBOUND r Produces
                LET composition = FIRST(
                  FOR co IN Composition
                    FILTER p.detailed.composition == co._id
                    return co.definition
                )
                RETURN {[p._key]: {
                  detailed: MERGE_RECURSIVE(p.detailed, {composition}), 
                  serialized: p.serialized
                }}
            )
            RETURN MERGE(UNION(consumes, produces))
      )
      LET processes = (
        FOR cs IN INBOUND css IsPartOf
          LET refs2 = (
            FOR r, rs IN OUTBOUND cs References
              RETURN HAS(rs, "comments") ? { id: r._key, comments: rs.comments } : r._key
          )
          LET reaction = FIRST(
            FOR r in Reaction
              FILTER r._id == cs.reaction
              LET consumes2 = (
                FOR s, c IN OUTBOUND r Consumes
                  RETURN {state: s._key, count: c.count}
              )
              LET produces2 = (
                FOR s, p IN OUTBOUND r Produces
                  RETURN {state: s._key, count: p.count}
              )
              RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), {"lhs":consumes2}, {"rhs": produces2})
          )
          RETURN {
            reaction,
            info: [MERGE({ _key: cs._key, versionInfo: cs.versionInfo, references: refs2 }, cs.info)]
          }
      )
      LET contributor = FIRST(
        FOR o IN Organization
          FILTER o._id == css.organization
          RETURN UNSET(o, ["_key", "_id", "_rev"])
      )
      LET set = MERGE(UNSET(css, ["_rev", "_id", "organization"]), { references: refs, states, processes, contributor})
      RETURN HAS(set, "publishedIn") ? MERGE(set, {publishedIn: PARSE_IDENTIFIER(css.publishedIn).key}) : set
    `);
  return VersionedLTPDocument.parseAsync(await cursor.next());
}

export interface KeyedVersionInfo extends VersionInfo {
  _key: string;
  name: string;
}

/**
 * Finds all previous versions of set with key
 */
export async function setHistory(this: LXCatDatabase, key: string) {
  const id = `CrossSectionSet/${key}`;
  const cursor: ArrayCursor<KeyedVersionInfo> = await this.db.query(aql`
    FOR h IN 0..9999999 ANY ${id} CrossSectionSetHistory
      FILTER h.versionInfo.status != 'draft'
      SORT h.versionInfo.version DESC
      RETURN MERGE({_key: h._key, name: h.name}, h.versionInfo)
  `);
  return cursor.all();
}

/**
 * Find published/retracted css of archived version
 */
export async function activeSetOfArchivedSet(this: LXCatDatabase, key: string) {
  const id = `CrossSectionSet/${key}`;
  const cursor: ArrayCursor<KeyedVersionInfo> = await this.db.query(aql`
    FOR h
      IN 0..9999999
      ANY ${id}
      CrossSectionSetHistory
      FILTER ['published' ,'retracted'] ANY == h.versionInfo.status
      RETURN MERGE({_key: h._key, name: h.name}, h.versionInfo)
  `);
  return cursor.next();
}
