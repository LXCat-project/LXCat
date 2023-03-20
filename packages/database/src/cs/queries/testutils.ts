// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AnyAtomJSON } from "@lxcat/schema/dist/core/atoms";
import { LUT } from "@lxcat/schema/dist/core/data_types";
import { Storage } from "@lxcat/schema/dist/core/enumeration";
import { AnyMoleculeJSON } from "@lxcat/schema/dist/core/molecules";
import { InState } from "@lxcat/schema/dist/core/state";
import { Dict } from "@lxcat/schema/dist/core/util";
import { CrossSection } from "@lxcat/schema/dist/cs/cs";
import { deepClone } from "../../css/queries/deepClone";
import { db } from "../../db";
import { insert_state_dict } from "../../shared/queries";
import { StateTree } from "../../shared/queries/state";
import { Status } from "../../shared/types/version_info";
import { byOwnerAndId } from "./author_read";
import { createSection, updateSection } from "./write";

export async function createSampleCrossSection(
  state_ids: Dict<string>,
  status: Status = "published",
) {
  const cs: CrossSection<string, string> = sampleCrossSection();
  const idcs1 = await createSection(
    cs,
    state_ids,
    {},
    "Some organization",
    status,
  );
  const keycs1 = idcs1.replace("CrossSection/", "");
  return {
    __return: truncateCrossSectionCollections,
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

export function sampleCrossSection(): CrossSection<string, string, LUT> {
  return {
    reaction: {
      lhs: [{ count: 1, state: "s1" }],
      rhs: [{ count: 1, state: "s2" }],
      reversible: false,
      type_tags: [],
    },
    threshold: 42,
    type: Storage.LUT,
    labels: ["Energy", "Cross Section"],
    units: ["eV", "m^2"],
    data: [[1, 3.14e-20]],
    reference: [],
  };
}

export async function truncateCrossSectionCollections() {
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
    collections2Truncate.map((c) => db().collection(c).truncate()),
  );
}

export async function insertSampleStateIds() {
  const states = sampleStates();
  return await insert_state_dict(states);
}

export function sampleStates(): Dict<InState<AnyAtomJSON | AnyMoleculeJSON>> {
  return {
    s1: {
      particle: "A",
      charge: 0,
    },
    s2: {
      particle: "B",
      charge: 1,
    },
    s3: {
      particle: "C",
      charge: 2,
    },
    s4: {
      particle: "D",
      charge: 3,
    },
  };
}

export async function createDraftFromPublished(
  keycs1: string,
  alter: (cs: CrossSection<string, string, LUT>) => void,
) {
  const cs = await byOwnerAndId("somename@example.com", keycs1);
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
  const idcs2 = await updateSection(
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
