// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Status } from "@lxcat/schema";
import { NewProcess } from "@lxcat/schema/process";
import { AnySpecies } from "@lxcat/schema/species";
import { Database } from "arangojs";
import { deepClone } from "../../css/queries/deep-clone.js";
import { LXCatDatabase } from "../../lxcat-database.js";
import { KeyedProcess } from "../../schema/process.js";
import { StateTree } from "../../shared/types/state.js";
import { LXCatTestDatabase } from "../../testutils.js";

export async function createSampleCrossSection(
  db: LXCatTestDatabase,
  state_ids: Record<string, string>,
  status: Status = "published",
) {
  const cs = sampleCrossSection();
  const idcs1 = await db.createItem(
    cs,
    state_ids,
    {},
    "Some organization",
    status,
  );
  const keycs1 = idcs1.replace("CrossSection/", "");
  return {
    __return: async () => truncateCrossSectionCollections(db.getDB()),
    keycs1,
  };
}

export interface NestedState {
  latex: string;
  valid: boolean;
  children: Array<NestedState>;
}

export function removeIdsFromTree(tree: StateTree): Array<NestedState> {
  return Object.values(tree).map((summary) => ({
    ...summary,
    children: summary.children ? removeIdsFromTree(summary.children) : [],
  }));
}

export function sampleCrossSection(): NewProcess<string, string> {
  return {
    reaction: {
      lhs: [{ count: 1, state: "s1" }],
      rhs: [{ count: 1, state: "s2" }],
      reversible: false,
      typeTags: [],
    },
    info: [{
      threshold: 42,
      type: "CrossSection",
      references: [],
      data: {
        type: "LUT",
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        values: [[1, 3.14e-20]],
      },
    }],
  };
}

export async function truncateCrossSectionCollections(db: Database) {
  const collections2Truncate = [
    "Consumes",
    "CrossSection",
    "CrossSectionHistory",
    "Reaction",
    "Produces",
    "Reference",
    "References",
  ];
  await Promise.all(
    collections2Truncate.map((c) => db.collection(c).truncate()),
  );
}

export async function insertSampleStateIds(db: LXCatDatabase) {
  const states = sampleStates();
  return await db.insertStateDict(states);
}

export function sampleStates(): Record<string, AnySpecies> {
  return {
    s1: {
      type: "Atom",
      composition: [["He", 1]],
      charge: 0,
    },
    s2: {
      type: "Atom",
      composition: [["Ne", 1]],
      charge: 1,
    },
    s3: {
      type: "Atom",
      composition: [["Ar", 1]],
      charge: 2,
    },
    s4: {
      type: "Atom",
      composition: [["Kr", 1]],
      charge: 3,
    },
  };
}

export async function createDraftFromPublished(
  db: LXCatTestDatabase,
  keycs1: string,
  alter: (cs: KeyedProcess<string, string>) => void,
) {
  const cs = await db.getItemByOwnerAndId("somename@example.com", keycs1);
  if (cs === undefined) {
    throw Error(`Unable to retrieve cross section with id ${keycs1}`);
  }
  const cs1 = cs;
  const draftcs = deepClone(cs1);
  alter(draftcs);
  const lhs0 = draftcs.reaction.lhs[0].state;
  const rhs0 = draftcs.reaction.rhs[0].state;
  const draftStateIds = {
    [lhs0]: `State/${lhs0}`,
    [rhs0]: `State/${rhs0}`,
  };
  const idcs2 = await db.updateItem(
    keycs1,
    draftcs,
    "My first update",
    draftStateIds,
    {},
    "Some organization",
  );
  const keycs2 = idcs2.replace("CrossSection/", "");
  return { cs1, keycs2 };
}
