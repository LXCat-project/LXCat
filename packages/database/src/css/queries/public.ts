// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { VersionedLTPDocument, VersionInfo } from "@lxcat/schema";
import { type ReactionTypeTag } from "@lxcat/schema/process";
import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor.js";
import { LXCatDatabase } from "../../lxcat-database.js";
import {
  ChoiceRow,
  generateStateChoicesAql,
  generateStateFilterAql,
  groupStateChoices,
  StateChoices,
} from "../../shared/queries/state.js";
import { PagingOptions } from "../../shared/types/search.js";
import {
  CrossSectionSetHeading,
  CrossSectionSetItem,
  FilterOptions,
  SortOptions,
} from "../public.js";

export async function search(
  this: LXCatDatabase,
  filter: FilterOptions,
  sort: SortOptions,
  paging: PagingOptions,
) {
  let contributor_aql = aql``;
  if (filter.contributor.length > 0) {
    contributor_aql = aql`
      LET contributor = FIRST(
        FOR o IN Organization
          FILTER o._id == css.organization
          RETURN o.name
      )
      FILTER ${filter.contributor} ANY == contributor
    `;
  }
  const hasFilterOnConsumedStates =
    Object.keys(filter.state.particle).length > 0;
  const hasFilterOnTag = filter.tag.length > 0;
  const hasFilterOnRection = hasFilterOnConsumedStates || hasFilterOnTag;
  let reactionAql = aql``;
  if (hasFilterOnRection) {
    const typeTagAql = hasFilterOnTag
      ? aql`FILTER ${filter.tag} ANY IN r.typeTags`
      : aql``;
    let stateAql = aql`RETURN 1`;
    if (hasFilterOnConsumedStates) {
      const stateFilter = generateStateFilterAql(filter.state);
      stateAql = aql`
        FOR c IN Consumes
          FILTER c._from == r._id
          FOR s IN State
            FILTER s._id == c._to
            FILTER s.particle != 'e' // TODO should electron always be excluded?
            LET e = s.electronic[0] // TODO is there always 0 or 1 electronic array item?
            FILTER ${stateFilter}
            RETURN s.id
    `;
    }
    reactionAql = aql`
      LET states = (
        FOR m IN IsPartOf
          FILTER m._to == css._id
          FOR cs IN CrossSection
            FILTER cs._id == m._from
            FOR r in Reaction
              FILTER r._id == cs.reaction
              ${typeTagAql}
              ${stateAql}
      )
      FILTER LENGTH(states) > 0
    `;
  }

  let sort_aql = aql``;
  if (sort.field === "name") {
    sort_aql = aql`SORT css.name ${sort.dir}`;
  } else if (sort.field === "contributor") {
    sort_aql = aql`SORT contributor ${sort.dir}`;
  }
  const limit_aql = aql`LIMIT ${paging.offset}, ${paging.count}`;
  const q = aql`
      FOR css IN CrossSectionSet
          FILTER css.versionInfo.status == 'published' // Public API can only search on published sets
          ${reactionAql}
          ${contributor_aql}
          ${sort_aql}
          ${limit_aql}
          RETURN {'id': css._key, name: css.name}
      `;

  const cursor: ArrayCursor<CrossSectionSetHeading> = await this.db.query(q);
  return await cursor.all();
}

export async function searchFacets(
  this: LXCatDatabase,
  selection: FilterOptions,
): Promise<FilterOptions> {
  /* eslint-disable @typescript-eslint/no-unused-vars -- use destructure and unused var to omit key */
  const { contributor: _c, ...nonContributorSelection } = selection;
  const { state: _s, ...nonStateSelection } = selection;
  const { tag: _t, ...nonTagSelection } = selection;
  /* eslint-enable @typescript-eslint/no-unused-vars */
  return {
    contributor: await this.searchContributors(nonContributorSelection),
    state: await this.stateChoices(nonStateSelection),
    tag: await this.tagChoices(nonTagSelection),
  };
}

export async function searchContributors(
  this: LXCatDatabase,
  selection: Omit<FilterOptions, "contributor">,
) {
  const hasTagSelection = selection.tag.length > 0;
  const hasStateSelection = Object.keys(selection.state).length > 0;
  let csFilter = aql``;
  if (hasTagSelection || hasStateSelection) {
    const tagFilter = hasTagSelection
      ? aql`FILTER ${selection.tag} ANY IN r.typeTags`
      : aql``;
    const stateFilter = generateStateChoiceFilter(selection.state);
    csFilter = aql`
      LET filteredCs = (
        FOR p IN IsPartOf
          FILTER p._to == css._id
          FOR cs IN CrossSection
            FILTER cs._id == p._from
            FOR r in Reaction
              FILTER r._id == cs.reaction
              ${tagFilter}
              ${stateFilter}
              RETURN 1
      )  
      FILTER LENGTH(filteredCs) > 0
    `;
  }
  const q = aql`
    FOR css IN CrossSectionSet
      FILTER css.versionInfo.status == 'published'
      ${csFilter}
      FOR o IN Organization
        FILTER o._id == css.organization
        COLLECT on = o.name
        SORT on
        RETURN on
  `;
  const cursor: ArrayCursor<string> = await this.db.query(q);
  return await cursor.all();
}

function generateStateChoiceFilter(state: StateChoices) {
  const statefilterAql = generateStateFilterAql(state, "s");
  const stateFilter = aql`
      LET stateMatches = (
        FOR c IN Consumes
          FILTER c._from == r._id
          FOR s IN State
            FILTER s._id == c._to
            FILTER ${statefilterAql}
            RETURN 1
      )
      FILTER LENGTH(stateMatches) > 0
    `;
  return stateFilter;
}

export async function stateChoices(
  this: LXCatDatabase,
  selection: Omit<FilterOptions, "state">,
): Promise<StateChoices> {
  const hasTagSelection = selection.tag.length > 0;
  const stateAql = generateStateChoicesAql();
  const tagFilter = hasTagSelection
    ? aql`FILTER ${selection.tag} ANY IN r.typeTags`
    : aql``;
  const hasContributorSelection = selection.contributor.length > 0;
  const contributorFilter = hasContributorSelection
    ? aql`
    LET org = DOCUMENT('Organization', css.organization)
    FILTER org != null AND ${selection.contributor} ANY == org.name
  `
    : aql``;
  const cursor: ArrayCursor<ChoiceRow> = await this.db.query(aql`
    FOR css IN CrossSectionSet
        FILTER css.versionInfo.status == 'published'
        ${contributorFilter}
        FOR p IN IsPartOf
            FILTER p._to == css._id
            FOR cs IN CrossSection
                FILTER cs._id == p._from
                FOR r in Reaction
                    FILTER r._id == cs.reaction
                    ${tagFilter}
                    FOR c IN Consumes
                        FILTER c._from == r._id
                        FOR s IN State
                            FILTER s._id == c._to
                            FILTER s.particle != 'e' // TODO should e be filtered out?
                            ${stateAql}
    `);
  // TODO when there is one choice then there is no choices and choice should be removed or selected?
  const rows = await cursor.all();
  return groupStateChoices(rows);
}

export async function tagChoices(
  this: LXCatDatabase,
  selection: Omit<FilterOptions, "tag">,
): Promise<ReactionTypeTag[]> {
  const hasContributorSelection = selection.contributor.length > 0;
  const contributorFilter = hasContributorSelection
    ? aql`
    LET org = DOCUMENT('Organization', css.organization)
    FILTER org != null AND ${selection.contributor} ANY == org.name
  `
    : aql``;
  const stateFilter = generateStateChoiceFilter(selection.state);
  const q = aql`
    FOR css IN CrossSectionSet
      FILTER css.versionInfo.status == 'published'
      ${contributorFilter}
      FOR p IN IsPartOf
        FILTER p._to == css._id
        FOR cs IN CrossSection
          FILTER cs._id == p._from
          FOR r in Reaction
            FILTER r._id == cs.reaction
            ${stateFilter}
            FOR t IN r.typeTags
              COLLECT tt = t
              SORT tt
              RETURN tt
  `;
  const cursor: ArrayCursor<ReactionTypeTag> = await this.db.query(q);
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

// TODO: Merge byId and byIdJSON.
export async function byIdJSON(this: LXCatDatabase, id: string) {
  const cursor: ArrayCursor<unknown> = await this.db.query(aql`
    FOR css IN CrossSectionSet
        FILTER css._key == ${id}
        FILTER css.versionInfo.status != 'draft'
        LET refs = MERGE(
            FOR i IN IsPartOf
                FILTER i._to == css._id
                FOR cs IN CrossSection
                    FILTER cs._id == i._from
                        FOR rs IN References
                            FILTER rs._from == cs._id
                            FOR r IN Reference
                                FILTER r._id == rs._to
                                RETURN {[r._key]: UNSET(r, ["_key", "_rev", "_id"])}
                        )
        LET states = MERGE(
            FOR i IN IsPartOf
                FILTER i._to == css._id
                FOR cs IN CrossSection
                    FILTER cs._id == i._from
                        FOR r in Reaction
                            FILTER r._id == cs.reaction
                            LET consumes = (
                                FOR c IN Consumes
                                FILTER c._from == r._id
                                    FOR c2s IN State
                                    FILTER c2s._id == c._to
                                    RETURN { [c2s._key]: c2s.detailed }
                            )
                            LET produces = (
                                FOR p IN Produces
                                FILTER p._from == r._id
                                    FOR p2s IN State
                                    FILTER p2s._id == p._to
                                    RETURN { [p2s._key]: p2s.detailed }
                            )
                            RETURN MERGE(UNION(consumes, produces))

            )
        LET processes = (
            FOR i IN IsPartOf
                FILTER i._to == css._id
                FOR cs IN CrossSection
                    FILTER cs._id == i._from
                    LET refs2 = (
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
        RETURN MERGE(UNSET(css, ["_rev", "_id", "organization"]), {references: refs, states, processes, contributor})
    `);
  return VersionedLTPDocument.parseAsync(await cursor.next());
}

export async function byId(this: LXCatDatabase, id: string) {
  const cursor: ArrayCursor<CrossSectionSetItem> = await this.db.query(aql`
      FOR css IN CrossSectionSet
          FILTER css._key == ${id}
          FILTER ['published' ,'retracted', 'archived'] ANY == css.versionInfo.status
          LET processes = (
              FOR m IN IsPartOf
                  FILTER m._to == css._id
                  FOR cs IN CrossSection
                      FILTER cs._id == m._from
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
                              RETURN MERGE(UNSET(r, ["_key", "_rev", "_id"]), {"lhs":consumes}, {"rhs": produces})
                      )
                      RETURN MERGE(
                          UNSET(cs, ["_key", "_rev", "_id", "organization"]),
                          { "id": cs._key, reaction, "reference": refs}
                      )
              )
          LET contributor = FIRST(
              FOR o IN Organization
                  FILTER o._id == css.organization
                  RETURN o.name
          )
          RETURN MERGE({'id': css._key, processes, contributor}, UNSET(css, ["_key", "_rev", "_id", "organization"]))
      `);

  return cursor.next();
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
