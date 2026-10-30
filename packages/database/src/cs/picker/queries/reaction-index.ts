// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { aql } from "arangojs";
import { AqlQuery } from "arangojs/aql";
import { Cursor } from "arangojs/cursors";
import { LXCatDatabase } from "../../../lxcat-database.js";
import {
  IndexedReaction,
  IndexedSet,
  IndexedState,
  MAX_STATE_DEPTH,
  ReactionIndex,
} from "../types.js";

type StateRow = {
  key: string;
  isRoot: boolean;
  /** The LaTeX of this state at each level of the state tree. */
  latex: Array<string | null>;
  children: Array<string | null>;
};

async function buildReactionIndex(
  this: LXCatDatabase,
): Promise<ReactionIndex> {
  const all = async <T>(query: AqlQuery): Promise<Array<T>> => {
    const cursor: Cursor<T> = await this.db.query(query);
    return cursor.all();
  };

  const [reactions, stateRows, sets] = await Promise.all([
    all<IndexedReaction>(aql`
      FOR reaction IN Reaction
        LET items = (
          FOR cs IN CrossSection
            FILTER cs.reaction == reaction._id
            FILTER cs.versionInfo.status == "published"
            LET sets = (
              FOR css IN OUTBOUND cs IsPartOf
                FILTER css.versionInfo.status == "published"
                RETURN DISTINCT css._key
            )
            FILTER LENGTH(sets) > 0
            RETURN { key: cs._key, sets }
        )
        FILTER LENGTH(items) > 0
        RETURN {
          consumes: (
            FOR state IN OUTBOUND reaction Consumes
              FILTER state != null
              RETURN state._key
          ),
          produces: (
            FOR state IN OUTBOUND reaction Produces
              FILTER state != null
              RETURN state._key
          ),
          typeTags: reaction.typeTags,
          reversible: reaction.reversible,
          items
        }
    `),
    all<StateRow>(aql`
      FOR state IN State
        RETURN {
          key: state._key,
          isRoot: NOT HAS(state.detailed, "electronic"),
          latex: [
            state.serialized.latex,
            state.serialized.electronic.latex,
            state.serialized.electronic.vibrational.latex,
            state.serialized.electronic.vibrational.rotational.latex
          ],
          children: (FOR child IN OUTBOUND state HasDirectSubstate RETURN child._key)
        }
    `),
    all<IndexedSet>(aql`
      FOR css IN CrossSectionSet
        FILTER css.versionInfo.status == "published"
        LET org = FIRST(
          FOR org IN Organization
            FILTER org._id == css.organization
            RETURN org
        )
        FILTER org != null
        RETURN {
          key: css._key,
          name: css.name,
          organizationKey: org._key,
          organizationName: org.name
        }
    `),
  ]);

  const rows = new Map(stateRows.map((row) => [row.key, row]));
  const states = new Map<string, IndexedState>();
  const parents = new Map<string, string>();
  const roots: Array<string> = [];

  const add = (key: string, depth: number) => {
    const row = rows.get(key)!;

    // An edge can point to a state that does not exist, for example while a
    // set is being deleted. Such a child is not part of the tree.
    const children = row.children.filter(
      (child): child is string => child !== null && rows.has(child),
    );

    states.set(key, { latex: row.latex[depth] ?? "", children });
    if (depth < MAX_STATE_DEPTH) {
      for (const child of children) {
        parents.set(child, key);
        add(child, depth + 1);
      }
    }
  };
  for (const { key, isRoot } of stateRows) {
    if (isRoot) {
      roots.push(key);
      add(key, 0);
    }
  }

  return { reactions, states, roots, parents, sets };
}

/**
 * Identifies the published data an index is built from.
 *
 * A published set does not change, new data comes as a new set, and a
 * published set changes revision when it is retracted, archived or deleted.
 * So the revisions of the published sets, together with those of the
 * organizations whose names the picker shows, tell when the index is outdated.
 * Edits of other documents, such as drafts, do not affect the published data.
 */
async function getFingerprint(this: LXCatDatabase) {
  const cursor: Cursor<string> = await this.db.query(aql`
    RETURN MD5(TO_STRING([
      (FOR css IN CrossSectionSet FILTER css.versionInfo.status == "published" SORT css._key RETURN css._rev),
      (FOR org IN Organization SORT org._key RETURN org._rev)
    ]))
  `);
  return (await cursor.next())!;
}

/** The fingerprint query that is running, so that concurrent calls share it. */
const fingerprints = new WeakMap<LXCatDatabase, Promise<string>>();

function currentFingerprint(db: LXCatDatabase) {
  let fingerprint = fingerprints.get(db);
  if (fingerprint === undefined) {
    fingerprint = getFingerprint.call(db).finally(() =>
      fingerprints.delete(db)
    );
    fingerprints.set(db, fingerprint);
  }
  return fingerprint;
}

const cache = new WeakMap<
  LXCatDatabase,
  { call: number; fingerprint: string; index: Promise<ReactionIndex> }
>();

let calls = 0;

/**
 * Get the index of the published reactions, which is rebuilt when the
 * published data changed.
 *
 * Concurrent calls share a single build and a single check of the data.
 */
export async function getReactionIndex(this: LXCatDatabase) {
  const call = ++calls;

  // The fingerprint is read before the data. When the data changes in between,
  // the next call notices and builds the index again.
  const fingerprint = await currentFingerprint(this);

  const cached = cache.get(this);
  if (cached !== undefined && cached.fingerprint === fingerprint) {
    return cached.index;
  }

  const index = buildReactionIndex.call(this);

  // A call that started before the one that cached the index, but read its
  // fingerprint later, has the newer data with an older fingerprint. It would
  // make the next call build the index again, so it leaves the cache alone.
  if (cached === undefined || cached.call < call) {
    cache.set(this, { call, fingerprint, index });
    index.catch(() => {
      if (cache.get(this)?.index === index) {
        cache.delete(this);
      }
    });
  }

  return index;
}
