// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LTPMixture } from "@lxcat/schema";
import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor.js";
import { LXCatDatabase } from "../../lxcat-database.js";
import { OwnedProcess } from "../../schema/process.js";
import { PagingOptions } from "../../shared/types/search.js";
import { KeyedVersionInfo } from "../../shared/types/version-info.js";
import { CrossSectionHeading } from "../public.js";

export async function byId(this: LXCatDatabase, id: string) {
  const cursor: ArrayCursor<unknown> = await this.db.query(aql`
  FOR cs IN CrossSection
    FILTER cs._key == ${id}
    FILTER cs.versionInfo.status != 'draft'
    LET references = (
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
          RETURN MERGE(UNSET(s, ["_rev", "_id", "versionInfo", "organization"]), {contributor: DOCUMENT(s.organization).name})
    )
    LET reaction = FIRST(
      FOR r in Reaction
        FILTER r._id == cs.reaction
        LET consumes = (
          FOR c, e IN OUTBOUND r Consumes
            LET composition = FIRST(
              FOR co IN Composition
                FILTER c.detailed.composition == co._id
                return co.definition
            )
            RETURN {state: MERGE_RECURSIVE(UNSET(c, ["_key", "_rev", "_id"]), {detailed: {composition}}), count: e.count}
        )
        LET produces = (
          FOR p, e IN OUTBOUND r Produces
            LET composition = FIRST(
              FOR co IN Composition
                FILTER p.detailed.composition == co._id
                return co.definition
            )
            RETURN {state: MERGE_RECURSIVE(UNSET(p, ["_key", "_rev", "_id"]), {detailed: {composition}}), count: e.count}
        )
        RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), {"lhs":consumes}, {"rhs": produces})
    )
    RETURN { reaction, info: [MERGE({ _key: cs._key, versionInfo: cs.versionInfo, references, isPartOf: sets }, cs.info)] }
  `);
  return OwnedProcess.parseAsync(await cursor.next());
}

export async function byIds(this: LXCatDatabase, ids: string[]) {
  const cursor: ArrayCursor<LTPMixture> = await this.db.query(aql`
    LET setIdsUnfiltered = (
      FOR cs IN CrossSection
        FILTER cs._key IN ${ids}
        FILTER cs.versionInfo.status != 'draft'
        FOR css IN OUTBOUND cs IsPartOf
          FILTER css.versionInfo.status != 'draft'
          RETURN DISTINCT css._id
    )
    LET setIds = (
      FOR setId IN setIdsUnfiltered
        let hasNewer = FIRST(
          FOR setNewer IN 1..1000000 INBOUND setId CrossSectionSetHistory
            FILTER setNewer.versionInfo.status != 'draft'
            FILTER setNewer._id IN setIdsUnfiltered
            RETURN 1
        )
        FILTER IS_NULL(hasNewer)
        return setId
    )
    LET sets = MERGE(
      FOR setId IN setIds
        LET css = FIRST(
          FOR css IN CrossSectionSet
            FILTER css._id == setId
            RETURN css
        )
        RETURN {[css._key]: MERGE(
          UNSET(css, ["_rev", "_id", "organization", "publishedIn"]),
          {contributor: UNSET(DOCUMENT(css.organization), ["_id", "_key", "_rev"])},
          IS_NULL(css.publishedIn) ? {} : {publishedIn: PARSE_IDENTIFIER(css.publishedIn).key}
        )}
    )
    LET itemReferences = MERGE(
      FOR cs IN CrossSection
        FILTER cs._key IN ${ids}
        FILTER cs.versionInfo.status != 'draft'
        FOR r IN OUTBOUND cs References
          RETURN {[r._key]: UNSET(r, ["_key", "_rev", "_id"])}
    )
    LET setReferences = MERGE(
      FOR setId IN setIds
        FOR set IN CrossSectionSet
          FILTER set._id == setId
          FOR r IN Reference
            FILTER set.publishedIn == r._id
            RETURN {[r._key]: UNSET(r, ["_key", "_rev", "_id"])}
    )
    LET references = MERGE([setReferences, itemReferences])
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
                LET composition = FIRST(
                  FOR co IN Composition
                    FILTER c2s.detailed.composition == co._id
                    return co.definition
                )
                RETURN {[c2s._key]: MERGE_RECURSIVE(UNSET(c2s, ["_key", "_rev", "_id"]), {detailed: {composition}})}
          )
          LET produces = (
            FOR p IN Produces
              FILTER p._from == r._id
              FOR p2s IN State
                FILTER p2s._id == p._to
                LET composition = FIRST(
                  FOR co IN Composition
                    FILTER p2s.detailed.composition == co._id
                    return co.definition
                )
                RETURN {[p2s._key]: MERGE_RECURSIVE(UNSET(p2s, ["_key", "_rev", "_id"]), {detailed: {composition}})}
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
          FOR r, re IN OUTBOUND cs References
            RETURN HAS(re, "comments") ? {
              id: r._key,
              comments: re.comments
            } : r._key
        )
        LET sets2 = (
          FOR p IN IsPartOf
            FILTER cs._id == p._from
            FILTER p._to IN setIds
            RETURN PARSE_IDENTIFIER(p._to).key
        )
        RETURN { reaction, info: [MERGE({ _key: cs._key, versionInfo: cs.versionInfo, references: refs2, isPartOf: sets2 }, cs.info)] }
    )
    RETURN {
      states,
      references,
      processes,
      sets
    }
  `);

  return await cursor.next() ?? {
    states: {},
    references: {},
    processes: [],
    sets: {},
  };
}

export async function getCSHeadings(
  this: LXCatDatabase,
  csIds: Array<string>,
  paging: PagingOptions,
) {
  const limitAql = aql`LIMIT ${paging.offset}, ${paging.count}`;

  const q = aql`
	  FOR cs IN CrossSection
      FILTER cs._id IN ${csIds}
      FILTER cs.versionInfo.status == 'published'

	    LET refs = (
        FOR r IN OUTBOUND cs References
		  	  RETURN UNSET(r, ["_key", "_rev", "_id"])
	    )
	    LET reaction = FIRST(
        FOR reaction IN Reaction
          FILTER reaction._id == cs.reaction
          LET produces = (
            FOR state, stoich IN OUTBOUND reaction Produces
              LET composition = FIRST(
                FOR co IN Composition
                  FILTER state.detailed.composition == co._id
                  return co.definition
              )
		  	      RETURN {state: MERGE_RECURSIVE(UNSET(state, ["_key", "_rev", "_id"]), {detailed: {composition}}), count: stoich.count}
          )
          LET consumes = (
            FOR state, stoich IN OUTBOUND reaction Consumes
              LET composition = FIRST(
                FOR co IN Composition
                  FILTER state.detailed.composition == co._id
                  return co.definition
              )
		  	      RETURN {state: MERGE_RECURSIVE(UNSET(state, ["_key", "_rev", "_id"]), {detailed: {composition}}), count: stoich.count}
          )
		      RETURN MERGE(
            UNSET(reaction, ["_key", "_rev", "_id"]), 
            {"lhs":consumes, "rhs": produces}
          )
      )
	    LET setNames = (
        FOR css IN OUTBOUND cs IsPartOf
          FILTER css.versionInfo.status == "published"
          LET org = FIRST(
            FOR org IN Organization
              FILTER org._id == css.organization
              RETURN org
          )
          LET ref = FIRST(
            FOR ref IN Reference
              FILTER ref._id == css.publishedIn
              RETURN UNSET(ref, ["_key", "_rev", "_id"])
          )
          RETURN MERGE(UNSET(css, ["_key", "_rev", "_id"]), { id: css._key, organization: org.name, publishedIn: ref })
	    )
	    ${limitAql}
	    RETURN { id: cs._key, reaction: reaction, threshold: cs.info.threshold, reference: refs, isPartOf: setNames }
	`;
  const cursor: ArrayCursor<CrossSectionHeading> = await this.db.query(q);
  return await cursor.all();
}

/**
 * Finds all previous versions of set with key
 */
export async function csHistory(this: LXCatDatabase, key: string) {
  const id = `CrossSection/${key}`;
  const cursor: ArrayCursor<unknown> = await this.db.query(aql`
    FOR h IN 0..9999999
      ANY ${id}
      CrossSectionHistory
      FILTER h.versionInfo.status != 'draft'
      SORT h.versionInfo.version DESC
      RETURN MERGE({_key: h._key}, h.versionInfo)
  `);
  return await cursor.all().then((results) =>
    results.map((info) => KeyedVersionInfo.parse(info))
  );
}
