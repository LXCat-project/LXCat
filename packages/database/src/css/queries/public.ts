// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { VersionedLTPDocument, VersionInfo } from "@lxcat/schema";

import { aql } from "arangojs";
import { Cursor } from "arangojs/cursors";
import { LXCatDatabase } from "../../lxcat-database.js";
import { CrossSectionSetHeading } from "../public.js";

export async function listSets(this: LXCatDatabase, contributor?: string) {
  const cursor: Cursor<CrossSectionSetHeading> = await this.db.query(aql`
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
  const cursor: Cursor<string> = await this.db.query(aql`
      FOR css IN CrossSectionSet
        FILTER css._key == ${setId}
        FOR cs IN INBOUND css IsPartOf
          RETURN cs._key
    `);
  return cursor.all();
}

// Process as it leaves the AQL query of `byId`: the reaction is
// duplicated in serialized form, but the id of the reaction node is
// carried along so processes of the same reaction can be regrouped.
type QueriedProcess = {
  reactionId: string;
  info: Array<{ type: string }>;
};

// Ingest splits a process with multiple info entries into one cross
// section per entry (see `createSet`), which loses the pairing between a
// rate coefficient and the energy rate coefficient of the same process.
// Reunite an `EnergyRateCoefficient` info with the process of the same
// reaction that carries the info it belongs to: consumers such as ChemCat
// expect both info entries on a single process, and cannot make sense of
// a process that has an energy rate coefficient but no rate coefficient.
const groupEnergyRateCoefficients = <T extends QueriedProcess>(
  processes: T[],
): T[] => {
  // The index of the process that holds the non-energy info of a reaction.
  const base = new Map<string, number>();
  // The indexes of the processes that only hold energy rate coefficient
  // infos of a reaction.
  const energyOnly = new Map<string, number[]>();

  processes.forEach((process, index) => {
    const hasInfoOfItsOwn = process.info.some(
      (info) => info.type !== "EnergyRateCoefficient",
    );
    if (hasInfoOfItsOwn) {
      if (!base.has(process.reactionId)) {
        base.set(process.reactionId, index);
      }
    } else if (process.info.length > 0) {
      const merged = energyOnly.get(process.reactionId) ?? [];
      merged.push(index);
      energyOnly.set(process.reactionId, merged);
    }
  });

  return processes
    .map((process, index) => {
      // The first process of a reaction with info of its own absorbs the
      // energy rate coefficient infos of the reaction. A reaction with
      // several rate coefficients keeps them on separate processes; the
      // energy rate coefficients then join the first of those.
      if (base.get(process.reactionId) === index) {
        const absorbed = (energyOnly.get(process.reactionId) ?? []).flatMap(
          (merged) => processes[merged].info,
        );
        return { ...process, info: [...process.info, ...absorbed] };
      }
      return process;
    })
    .filter((_, index) => {
      const reactionId = processes[index].reactionId;
      // An energy rate coefficient without a rate coefficient of the same
      // reaction cannot be regrouped, so keep it as its own process.
      return base.get(reactionId) === undefined
        || !(energyOnly.get(reactionId) ?? []).includes(index);
    });
};

export async function byId(
  this: LXCatDatabase,
  id: string,
  allowDrafts: boolean = false,
) {
  const cursor: Cursor<unknown> = await this.db.query(aql`
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
            reactionId: cs.reaction,
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
  const raw = (await cursor.next()) as
    | { processes: QueriedProcess[] }
    | undefined;
  return VersionedLTPDocument.parseAsync(
    raw === undefined ? raw : {
      ...raw,
      processes: groupEnergyRateCoefficients(raw.processes),
    },
  );
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
  const cursor: Cursor<KeyedVersionInfo> = await this.db.query(aql`
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
  const cursor: Cursor<KeyedVersionInfo> = await this.db.query(aql`
    FOR h
      IN 0..9999999
      ANY ${id}
      CrossSectionSetHistory
      FILTER ['published' ,'retracted'] ANY == h.versionInfo.status
      RETURN MERGE({_key: h._key, name: h.name}, h.versionInfo)
  `);
  return cursor.next();
}
