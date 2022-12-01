// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { db } from "../../db";
import { PagingOptions } from "../../shared/types/search";
import {
  CrossSectionBag,
  CrossSectionHeading,
  CrossSectionItem,
} from "../public";
import { ReactionTemplate } from "../picker/types";
import { KeyedVersionInfo } from "../../shared/types/version_info";

export async function byId(id: string) {
  const cursor: ArrayCursor<CrossSectionItem> = await db().query(aql`
  FOR cs IN CrossSection
    FILTER cs._key == ${id}
    FILTER cs.versionInfo.status != 'draft'
    LET refs = (
      FOR rs IN References
        FILTER rs._from == cs._id
        FOR r IN Reference
          FILTER r._id == rs._to
          RETURN UNSET(r, ["_key", "_rev", "_id"])
      )
      LET sets = (
      FOR p IN IsPartOf
        FILTER p._from == cs._id
        FOR s IN CrossSectionSet
          FILTER s._id == p._to
          FILTER ['published' ,'retracted'] ANY == s.versionInfo.status
          RETURN MERGE(UNSET(s, ["_key", "_rev", "_id", "organization"]), {id: s._key, organization: DOCUMENT(s.organization).name})
      )
      LET reaction = (
        FOR r in Reaction
          FILTER r._id == cs.reaction
          LET consumes = (
            FOR c IN Consumes
            FILTER c._from == r._id
              FOR c2s IN State
              FILTER c2s._id == c._to
              RETURN {state: UNSET(c2s, ["_key", "_rev", "_id"]), count: c.count}
          )
          LET produces = (
            FOR p IN Produces
            FILTER p._from == r._id
              FOR p2s IN State
              FILTER p2s._id == p._to
              RETURN {state: UNSET(p2s, ["_key", "_rev", "_id"]), count: p.count}
          )
          RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), {"lhs":consumes}, {"rhs": produces})
      )
      RETURN MERGE(
        UNSET(cs, ["_key", "_rev", "_id", "organization"]),
        { "id": cs._key, "reaction": FIRST(reaction), "reference": refs, "isPartOf": sets}
      )
  `);
  return await cursor.next();
}

export async function byIds(ids: string[]) {
  const cursor: ArrayCursor<CrossSectionBag> = await db().query(aql`
    LET sets = MERGE(
      FOR cs IN CrossSection
        FILTER cs._key IN ${ids}
        FILTER cs.versionInfo.status != 'draft'
        FOR p IN IsPartOf
          FILTER cs._id == p._from
          FOR css IN CrossSectionSet
            FILTER p._to == css._id
              RETURN {[css._key]:  MERGE(UNSET(css, ["_key", "_rev", "_id", "organization", "versionInfo"]), {organization: DOCUMENT(css.organization).name})}
    )
    LET references = MERGE(
      FOR cs IN CrossSection
        FILTER cs._key IN ${ids}
        FILTER cs.versionInfo.status != 'draft'
        FOR rs IN References
          FILTER rs._from == cs._id
          FOR r IN Reference
            FILTER r._id == rs._to
            RETURN {[r._key]: UNSET(r, ["_key", "_rev", "_id"])}
    )
    LET states = MERGE(
      FOR cs IN CrossSection
        FILTER cs._key IN ${ids}
        FILTER cs.versionInfo.status != 'draft'
        FOR r in Reaction
          FILTER r._id == cs.reaction
          LET consumes = (
            FOR c IN Consumes
              FILTER c._from == r._id
              FOR c2s IN State
                FILTER c2s._id == c._to
                RETURN {[c2s._key]: UNSET(c2s, ["_key", "_rev", "_id", "id"])}
          )
          LET produces = (
            FOR p IN Produces
              FILTER p._from == r._id
              FOR p2s IN State
                FILTER p2s._id == p._to
                RETURN {[p2s._key]: UNSET(p2s, ["_key", "_rev", "_id", "id"])}
          )
        RETURN MERGE(UNION(consumes, produces))
    )
    LET processes = (
      FOR cs IN CrossSection
        FILTER cs._key IN ${ids}
        FILTER cs.versionInfo.status != 'draft'
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
        LET refs2 = (
          FOR rs IN References
            FILTER rs._from == cs._id
            FOR r IN Reference
              FILTER r._id == rs._to
              RETURN r._key
        )
        LET sets2 = (
          FOR p IN IsPartOf
            FILTER cs._id == p._from
            RETURN PARSE_IDENTIFIER(p._to).key
        )
        RETURN MERGE(UNSET(cs, ["_key", "_rev", "_id", "versionInfo", "organization"]),{ id: cs._key, reaction, reference: refs2, isPartOf: sets2})
    )
    RETURN {
      states,
      references,
      processes,
      sets
    }
  `);

  const result = await cursor.next();
  if (result === undefined) {
    return {
      states: {},
      references: {},
      processes: [],
      sets: {},
    };
  }
  return result;
}

export async function getCSHeadings(
  csIds: Array<string>,
  paging: PagingOptions
) {
  const limitAql = aql`LIMIT ${paging.offset}, ${paging.count}`;
  const q = aql`
	FOR cs IN CrossSection
          FILTER cs._id IN ${csIds}
          FILTER cs.versionInfo.status == 'published'
	  LET refs = (
		FOR rs IN References
		  FILTER rs._from == cs._id
		  FOR r IN Reference
			FILTER r._id == rs._to
			RETURN UNSET(r, ["_key", "_rev", "_id"])
	  )
	  LET reaction = FIRST(
		FOR r in Reaction
		  FILTER r._id == cs.reaction
		  LET consumes = (
			FOR c IN Consumes
			FILTER c._from == r._id
			  FOR c2s IN State
			  FILTER c2s._id == c._to
			  RETURN {state: UNSET(c2s, ["_key", "_rev", "_id"]), count: c.count}
		  )
		  LET produces = (
			FOR p IN Produces
			FILTER p._from == r._id
			  FOR p2s IN State
			  FILTER p2s._id == p._to
			  RETURN {state: UNSET(p2s, ["_key", "_rev", "_id"]), count: p.count}
		  )
		  RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), {"lhs":consumes, "rhs": produces})
	  )
	  LET setNames = (
            FOR css IN OUTBOUND cs IsPartOf
	      RETURN css.name
	  )
	  ${limitAql}
	  RETURN { "id": cs._key, "reaction": reaction, "reference": refs, "isPartOf": setNames}
	`;
  const cursor: ArrayCursor<CrossSectionHeading> = await db().query(q);
  return await cursor.all();
}

// TODO: Can this function be removed?
export async function search(
  _templates: Array<ReactionTemplate>,
  paging: PagingOptions
) {
  const reactionsAql = aql``; // TODO implement
  const limitAql = aql`LIMIT ${paging.offset}, ${paging.count}`;
  const q = aql`
	FOR cs IN CrossSection
    FILTER cs.versionInfo.status == 'published'
	  LET refs = (
		FOR rs IN References
		  FILTER rs._from == cs._id
		  FOR r IN Reference
			FILTER r._id == rs._to
			RETURN UNSET(r, ["_key", "_rev", "_id"])
	  )
    ${reactionsAql}
	  LET reaction = FIRST(
		FOR r in Reaction
		  FILTER r._id == cs.reaction
		  LET consumes = (
			FOR c IN Consumes
			FILTER c._from == r._id
			  FOR c2s IN State
			  FILTER c2s._id == c._to
			  RETURN {state: UNSET(c2s, ["_key", "_rev", "_id"]), count: c.count}
		  )
		  LET produces = (
			FOR p IN Produces
			FILTER p._from == r._id
			  FOR p2s IN State
			  FILTER p2s._id == p._to
			  RETURN {state: UNSET(p2s, ["_key", "_rev", "_id"]), count: p.count}
		  )
		  RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), {"lhs":consumes, "rhs": produces})
	  )
	  LET setNames = [] // TODO implement
	  ${limitAql}
	  RETURN { "id": cs._key, "reaction": reaction, "reference": refs, "isPartOf": setNames}
	`;
  const cursor: ArrayCursor<CrossSectionHeading> = await db().query(q);
  return await cursor.all();
}

/**
 * Finds all previous versions of set with key
 */
export async function historyOfSection(key: string) {
  const id = `CrossSection/${key}`;
  const cursor: ArrayCursor<KeyedVersionInfo> = await db().query(aql`
    FOR h
    IN 0..9999999
    ANY ${id}
    CrossSectionHistory
    FILTER h.versionInfo.status != 'draft'
    SORT h.versionInfo.version DESC
    RETURN MERGE({_key: h._key}, h.versionInfo)
  `);
  return await cursor.all();
}
