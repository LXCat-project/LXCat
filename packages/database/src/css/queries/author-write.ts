// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { EditedLTPDocument, Status, VersionInfo } from "@lxcat/schema";
import { NewProcess } from "@lxcat/schema/process";
import { ReferenceRef } from "@lxcat/schema/reference";
import { aql } from "arangojs";
import { Cursor } from "arangojs/cursors";
import deepEqual from "deep-equal";
import { now } from "../../date.js";
import { LXCatDatabase } from "../../lxcat-database.js";
import { KeyedProcess } from "../../schema/process.js";
import { mapReaction } from "../../shared/queries.js";

// TODO some queries have duplication which could be de-duped
export async function createSet(
  this: LXCatDatabase,
  // FIXME: createSet should only accept NewLTPDocument. Currently this
  //        function does too many different things.
  dataset: EditedLTPDocument,
  status: Status = "published",
  version = 1,
  commitMessage?: string,
) {
  const organizationId = await this.getOrganizationByName(dataset.contributor);

  if (organizationId === undefined) {
    throw new Error(
      `Cannot create dataset for organization ${dataset.contributor}, it does not exist.`,
    );
  }

  const versionInfo: VersionInfo = {
    status,
    version,
    createdOn: now(),
    commitMessage,
  };

  const state_ids = await this.insertStateDict(dataset.states);
  const reference_ids = await this.insertReferenceDict(dataset.references);

  const cs_set_id = await this.insertDocument("CrossSectionSet", {
    name: dataset.name,
    description: dataset.description,
    publishedIn: dataset.publishedIn && reference_ids[dataset.publishedIn],
    complete: dataset.complete,
    organization: organizationId,
    versionInfo,
  });

  for (
    const cs of dataset.processes.flatMap(({ reaction, info }) =>
      info.map((info) => ({ reaction, info: [info] }))
    )
  ) {
    if (cs.info[0]._key !== undefined) {
      // check so a crosssection can only be in sets from same organization
      const prevCs = await this.getItemByOrgAndId(
        dataset.contributor,
        cs.info[0]._key,
      );
      if (prevCs !== undefined) {
        if (isEqualProcess(cs, prevCs, state_ids, reference_ids)) {
          // the cross section in db with id cs.id has same content as given cs
          // Make cross sections part of set by adding to IsPartOf collection
          await this.insertEdge(
            "IsPartOf",
            `CrossSection/${cs.info[0]._key}`,
            cs_set_id,
          );
        } else {
          const cs_id = await this.updateItem(
            cs.info[0]._key,
            cs,
            `Indirect draft by editing set ${dataset.name} / ${cs_set_id}`,
            state_ids,
            reference_ids,
            organizationId,
          );
          // Make cross sections part of set by adding to IsPartOf collection
          await this.insertEdge("IsPartOf", cs_id, cs_set_id);
        }
      } else {
        // handle id which is not owned by organization, or does not exist.
        const cs_id = await this.createItem(
          cs,
          state_ids,
          reference_ids,
          organizationId,
          status,
        );
        // Make cross sections part of set by adding to IsPartOf collection
        await this.insertEdge("IsPartOf", cs_id, cs_set_id);
      }
    } else {
      delete cs.info[0]._key; // byOwnerAndId returns set with set.processes[*].id prop, while createSection does not need it
      const cs_id = await this.createItem(
        cs,
        state_ids,
        reference_ids,
        organizationId,
        status,
      );
      // Make cross sections part of set by adding to IsPartOf collection
      await this.insertEdge("IsPartOf", cs_id, cs_set_id);
    }
  }
  return cs_set_id.replace("CrossSectionSet/", "");
}

export async function updateVersionStatus(
  this: LXCatDatabase,
  key: string,
  status: Status,
) {
  await this.db.query(aql`
    FOR css IN CrossSectionSet
        FILTER css._key == ${key}
        UPDATE { _key: css._key, versionInfo: MERGE(css.versionInfo, {status: ${status}}) } IN CrossSectionSet
  `);
}

export async function publish(this: LXCatDatabase, key: string) {
  // TODO Publishing db calls should be done in a single transaction

  // We cannot have a set pointing to an archived section so perform check before publising drafts
  await this.doesPublishingEffectOtherSets(key);

  // For each changed/added cross section perform publishing of cross section
  const draftCrossSectionKeys = await this.draftItemsFromSet(key);
  for (const cskey of draftCrossSectionKeys) {
    await this.publishItem(cskey);
  }

  // when key has a published version then that old version should be archived aka Change status of current published section to archived
  const history = await this.setHistory(key);
  const previous_published_key = history
    .filter((h) => h !== null)
    .find((h) => h.status === "published");
  if (previous_published_key !== undefined) {
    await this.updateSetVersionStatus(previous_published_key._key, "archived");
  }

  // Change status of draft set to published
  await this.updateSetVersionStatus(key, "published");
}

export async function draftItemsFromSet(this: LXCatDatabase, key: string) {
  const cursor: Cursor<string> = await this.db.query(aql`
    FOR p IN IsPartOf
      FILTER p._to == CONCAT('CrossSectionSet/', ${key})
      FILTER DOCUMENT(p._from).versionInfo.status == 'draft'
      RETURN PARSE_IDENTIFIER(p._from).key
  `);
  return await cursor.all();
}

export async function updateSet(
  this: LXCatDatabase,
  /**
   * Key of set that needs to be updated aka create a draft from
   */
  key: string,
  set: EditedLTPDocument,
  message: string,
) {
  const info = await this.getSetVersionInfo(key);
  if (info === undefined) {
    throw Error("Can not update cross section set that does not exist");
  }
  const { status, version } = info;
  if (status === "draft") {
    await this.updateDraftSet(key, set, info, message);
    return key;
  } else if (status === "published") {
    return await this.createDraftSet(version, set, message, key);
  } else {
    throw Error("Can not update cross section set due to invalid status");
  }
}

export async function isDraftlessSet(this: LXCatDatabase, key: string) {
  const cursor: Cursor<string> = await this.db.query(aql`
    FOR h IN CrossSectionSetHistory
      FILTER h._to == CONCAT('CrossSectionSet/', ${key})
      RETURN PARSE_IDENTIFIER(h._from).key
  `);
  const newerKey = await cursor.next();
  if (newerKey !== undefined) {
    throw new Error(`Can not create draft, it already exists as ${newerKey}`);
  }
}

export async function createDraftSet(
  this: LXCatDatabase,
  version: number,
  set: EditedLTPDocument,
  message: string,
  key: string,
) {
  // check whether a draft already exists
  await this.isDraftlessSet(key);
  // Add to CrossSectionSet with status=='draft'
  const newStatus: Status = "draft";
  // For draft version = prev version + 1
  const newVersion = version + 1;
  // TODO perform createSet+insert_edge inside single transaction
  const keyOfDraft = await this.createSet(set, newStatus, newVersion, message);
  // Add previous version (published )and current version (draft) to CrossSectionSetHistory collection
  await this.insertEdge(
    "CrossSectionSetHistory",
    `CrossSectionSet/${keyOfDraft}`,
    `CrossSectionSet/${key}`,
  );
  return keyOfDraft;
}

export async function updateDraftSet(
  this: LXCatDatabase,
  key: string,
  dataset: EditedLTPDocument,
  versionInfo: VersionInfo,
  message: string,
) {
  const organizationId = await this.getOrganizationByName(dataset.contributor);

  if (organizationId === undefined) {
    throw new Error(
      `Cannot update draft dataset ${key} for organization ${dataset.contributor}, the organization does not exist.`,
    );
  }

  versionInfo.commitMessage = message;
  versionInfo.createdOn = now();
  const set = {
    name: dataset.name,
    description: dataset.description,
    complete: dataset.complete,
    organization: organizationId,
    versionInfo,
  };
  await this.db.query(aql`
    REPLACE { _key: ${key} } WITH ${set} IN CrossSectionSet
  `);
  const state_ids = await this.insertStateDict(dataset.states);
  const reference_ids = await this.insertReferenceDict(dataset.references);

  for (
    const cs of dataset.processes.flatMap(({ reaction, info }) =>
      info.map((info) => ({ reaction, info: [info] }))
    )
  ) {
    if (cs.info[0]._key !== undefined) {
      // check so a crosssection can only be in sets from same organization
      const prevCs = await this.getItemByOrgAndId(
        dataset.contributor,
        cs.info[0]._key,
      );

      const prevCSKey = cs.info[0]._key;
      delete cs.info[0]._key;

      if (prevCs !== undefined) {
        if (isEqualProcess(cs, prevCs, state_ids, reference_ids)) {
          // the cross section in db with id cs.id has same content as given cs
          // Make cross sections part of set by adding to IsPartOf collection
          await this.insertEdge(
            "IsPartOf",
            `CrossSection/${prevCSKey}`,
            `CrossSectionSet/${key}`,
          );
        } else {
          const cs_id = await this.updateItem(
            prevCSKey,
            cs,
            `Indirect draft by editing set ${dataset.name} / ${key}`,
            state_ids,
            reference_ids,
            organizationId,
          );
          // Make cross sections part of set by adding to IsPartOf collection
          await this.insertEdge("IsPartOf", cs_id, `CrossSectionSet/${key}`);
        }
      } else {
        // when id is not owned by organization, or does not exist just create it with a new id.
        const cs_id = await this.createItem(
          cs,
          state_ids,
          reference_ids,
          organizationId,
          "draft",
          undefined,
          `Indirect draft by editing set ${dataset.name} / ${key}`,
        );
        // Make cross sections part of set by adding to IsPartOf collection
        await this.insertEdge("IsPartOf", cs_id, `CrossSectionSet/${key}`);
      }
    } else {
      const cs_id = await this.createItem(
        cs,
        state_ids,
        reference_ids,
        organizationId,
        "draft",
        undefined,
        `Indirect draft by editing set ${dataset.name} / ${key}`,
      );
      // Make cross sections part of set by adding to IsPartOf collection
      await this.insertEdge("IsPartOf", cs_id, `CrossSectionSet/${key}`);
    }
  }
}

export async function removeDraftUnchecked(this: LXCatDatabase, key: string) {
  const setId = `CrossSectionSet/${key}`;

  await this.db.query(aql`
    FOR css IN CrossSectionSet
      FILTER css._key == ${key}
      REMOVE css IN CrossSectionSet
  `);
  await this.db.query(aql`
    FOR history IN CrossSectionSetHistory
      FILTER history._from == ${setId}
      REMOVE history IN CrossSectionSetHistory
  `);
  const touchedCSCursor = await this.db.query(aql`
    FOR p IN IsPartOf
      FILTER p._to == ${setId}
      REMOVE p IN IsPartOf
      RETURN OLD._from
  `);
  const touchedCS = await touchedCSCursor.all();

  // Remove draft cross sections that belong to this set, but skip cross
  // sections that are in another set. Also removes dangling
  // `CrossSectionHistory`, `Reaction`, `Consumes`, `Produces`, `State`,
  // `Reference`, and `References` entries.
  const removedCSCursor = await this.db.query(aql`
    FOR cs IN CrossSection
      FILTER ${touchedCS} ANY == cs._id
      FILTER cs.versionInfo.status == 'draft'
      LET isInSet = FIRST(
        FOR p IN IsPartOf
          FILTER p._from == cs._id
          RETURN 1
      )
      FILTER isInSet == null
      REMOVE cs IN CrossSection
      RETURN {id: OLD._id, reaction: OLD.reaction}
  `);
  const removedCS = await removedCSCursor.all();

  await this.db.query(aql`
    FOR history IN CrossSectionHistory
      FILTER ${removedCS.map((rem) => rem.id)} ANY == history._from
      REMOVE history IN CrossSectionHistory
  `);

  // Remove dangling `References` edges.
  const refEdgeCursor = await this.db.query(aql`
    FOR refs IN References
      FILTER ${removedCS.map((rem) => rem.id)} ANY == refs._from
      REMOVE refs IN References
      RETURN DISTINCT OLD._to
  `);
  const touchedRefs = await refEdgeCursor.all();

  // Remove dangling references.
  await this.db.query(aql`
    FOR ref IN Reference
      FILTER ${touchedRefs} ANY == ref._id
      LET hasCSRefs = FIRST(
        FOR refs IN References
          FILTER refs._to == ref._id
          RETURN 1
      )
      LET hasSetRefs = FIRST(
        FOR set IN CrossSectionSet
          FILTER HAS(set, "publishedIn")
          FILTER set.publishedIn == ref._id
          RETURN 1
      )
      FILTER hasCSRefs == null AND hasSetRefs == null
      REMOVE ref IN Reference
  `);

  const removedReactionsCursor = await this.db.query(aql`
    FOR reac IN Reaction
      FILTER ${removedCS.map((rem) => rem.reaction)} ANY == reac._id
      // Test whether reaction is used elsewhere.
      LET keepReaction = FIRST(
        FOR csOther IN CrossSection
          FILTER csOther.reaction == reac._id
          RETURN 1
      )
      FILTER keepReaction == null
      // Remove the reaction.
      REMOVE reac IN Reaction
      RETURN OLD._id
  `);
  const reactions = await removedReactionsCursor.all();

  const consumedCursor = await this.db.query(aql`
    FOR c IN Consumes
      FILTER ${reactions} ANY == c._from
      REMOVE c IN Consumes
      RETURN OLD._to
  `);
  const consumed = await consumedCursor.all();

  const producedCursor = await this.db.query(aql`
    FOR p IN Produces
      FILTER ${reactions} ANY == p._from
      REMOVE p IN Produces
      RETURN OLD._to
  `);
  const produced = await producedCursor.all();

  let stateList = [...new Set(consumed.concat(produced))];

  while (stateList.length != 0) {
    const removedStatesCursor = await this.db.query(aql`
      FOR s IN State
        FILTER ${stateList} ANY == s._id
        LET hasConsumes = FIRST(
          FOR c IN Consumes
            FILTER c._to == s._id
            RETURN 1
        )
        LET hasProduces = FIRST(
          FOR p IN Produces
            FILTER p._to == s._id
            RETURN 1
        )
        Let hasCompound = FIRST(
          FOR ic IN InCompound
            FILTER ic._from == s._id
            RETURN 1
        )
        FILTER hasConsumes == null AND hasProduces == null AND hasCompound == null
        REMOVE s IN State
        RETURN s._id
    `);
    const removedStates = await removedStatesCursor.all();

    // Get constituent states if state is a compound
    const compoundPromise = this.db.query(aql`
      FOR sub IN InCompound
        FILTER ${removedStates} ANY == sub._to
        REMOVE sub IN InCompound
        RETURN DISTINCT sub._from
    `).then((cursor) => cursor.all());

    // Get parents of removed states
    const parentPromise = this.db.query(aql`
      FOR sub IN HasDirectSubstate
        FILTER ${removedStates} ANY == sub._to
        REMOVE sub IN HasDirectSubstate
        RETURN DISTINCT sub._from
    `).then((cursor) => cursor.all());

    stateList = [
      ...new Set(
        (await Promise.all([parentPromise, compoundPromise])).flat(),
      ),
    ];
  }
}

export async function retractSetUnchecked(
  this: LXCatDatabase,
  key: string,
  message: string,
) {
  const newStatus: Status = "retracted";

  // TODO Currently cross sections which are in another published or draft set
  // are skipped aka not being retracted, is this OK?
  await this.db.query(aql`
    FOR set IN CrossSectionSet
      FILTER set._key == ${key}

      FOR cs IN INBOUND set IsPartOf
        LET nrOtherSets = LENGTH(
          FOR otherSet IN OUTBOUND cs IsPartOf
            FILTER otherSet._id != set._id
            AND ["published", "draft"] ANY == otherSet.versionInfo.status
            RETURN 1
        )
        FILTER nrOtherSets == 0
        UPDATE {
          _key: cs._key,
          versionInfo: MERGE(cs.versionInfo, {status: ${newStatus}, retractMessage: ${message}})
        } IN CrossSection
  `);

  return this.db.query(aql`
    FOR set IN CrossSectionSet
      FILTER set._key == ${key}

      UPDATE {
        _key: set._key,
        versionInfo: MERGE(set.versionInfo, {status: ${newStatus}, retractMessage: ${message}})
      } IN CrossSectionSet
  `);
}

export async function deleteSet(
  this: LXCatDatabase,
  key: string,
  message?: string,
) {
  const info = await this.getSetVersionInfo(key);
  if (info === undefined) {
    // Set does not exist, nothing to do
    return;
  }
  const { status } = info;
  if (status === "draft") {
    return this.removeDraftSetUnchecked(key);
  } else if (status === "published") {
    // Change status of published section to retracted
    // and Set retract message

    if (message === undefined || message === "") {
      throw new Error(
        "Retracting a published cross section set requires a commit message.",
      );
    }

    return this.retractSetUnchecked(key, message);
  } else {
    throw new Error("Can not delete set due to invalid status");
  }
}

function isEqualProcess(
  newCS: NewProcess<string, ReferenceRef<string>>,
  prevCS: KeyedProcess<string, ReferenceRef<string>>,
  stateLookup: Record<string, string>,
  referenceLookup: Record<string, string>,
) {
  const newMappedCS = {
    reaction: mapReaction(stateLookup, newCS.reaction),
    info: newCS.info.map((info, i) => ({
      ...info,
      // We need to add the keys when comparing to prevCS, as prevCS info
      // objects will always contain a key.
      _key: prevCS.info[i]._key,
      references: mapReferences(referenceLookup, info.references),
    })),
  };

  // Previous always has _key from db.
  const prevStateLookup = Object.fromEntries(
    ([] as [string, string][]).concat(
      prevCS.reaction.lhs.map((s) => [s.state, `State/${s.state}`]),
      prevCS.reaction.rhs.map((s) => [s.state, `State/${s.state}`]),
    ),
  );

  const prevMappedCS = {
    reaction: mapReaction(prevStateLookup, prevCS.reaction),
    info: prevCS.info.map((info) => ({
      ...info,
      references: info.references.map((r) =>
        typeof r === "string"
          ? `Reference/${r}`
          : { ...r, id: `Reference/${r.id}` }
      ),
    })),
  };

  const sortEntries = (
    one: { state: string; count: number },
    two: { state: string; count: number },
  ) => {
    if (one.state == two.state) {
      return two.count - one.count;
    }

    return one.state.localeCompare(two.state);
  };

  prevMappedCS.reaction.lhs.sort(sortEntries);
  prevMappedCS.reaction.rhs.sort(sortEntries);
  newMappedCS.reaction.lhs.sort(sortEntries);
  newMappedCS.reaction.rhs.sort(sortEntries);

  return deepEqual(newMappedCS, prevMappedCS);
}

const mapReferences = (
  referenceLookup: Record<string, string>,
  references: Array<ReferenceRef<string>>,
) =>
  references.map((ref) =>
    typeof ref === "string"
      ? referenceLookup[ref]
      : { ...ref, id: referenceLookup[ref.id] }
  );

export async function doesPublishingEffectOtherSets(
  this: LXCatDatabase,
  key: string,
) {
  type R = {
    _id: string;
    publishedAs: null | { _id: string; otherSetIds: string[] };
  };
  const cursor: Cursor<R> = await this.db.query(aql`
    // Exclude self and any previous versions
    LET lineage = (
      FOR hs IN 0..999999 OUTBOUND CONCAT('CrossSectionSet/', ${key}) CrossSectionSetHistory
        RETURN hs._id
    )
    FOR p IN IsPartOf
      FILTER p._to == CONCAT('CrossSectionSet/', ${key})
      FILTER DOCUMENT(p._from).versionInfo.status == 'draft'
      LET publishedAs = FIRST(
          FOR h IN CrossSectionHistory
            FILTER h._from == p._from
            // h._to is published version of p._from
            LET otherSetIds = (
                FOR p2 IN IsPartOf
                  FILTER p2._from == h._to AND lineage ALL != p2._to
                  RETURN p2._to
            )
            RETURN {_id: h._to, otherSetIds }
      )
      RETURN {_id: p._from, publishedAs }
  `);
  const result = await cursor.all();
  if (
    result.some(
      (r) => r.publishedAs !== null && r.publishedAs.otherSetIds.length > 0,
    )
  ) {
    const errors = result.map(
      (r) =>
        new Error(
          `Draft cross section (${r._id}) has published version (${
            r.publishedAs !== null && r.publishedAs._id
          }) in other cross section sets (${
            r.publishedAs !== null && r.publishedAs.otherSetIds.join(",")
          }).`,
        ),
    );
    throw new AggregateError(
      errors,
      "Unable to publish due to publishing would cause sets to have archived sections. Please make draft of other sets and use same draft cross sections as this set.",
    );
  }
}
