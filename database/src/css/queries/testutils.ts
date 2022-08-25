import { AnyAtomJSON } from "@lxcat/schema/dist/core/atoms";
import { ReactionTypeTag, Storage } from "@lxcat/schema/dist/core/enumeration";
import { AnyMoleculeJSON } from "@lxcat/schema/dist/core/molecules";
import { State } from "@lxcat/schema/dist/core/state";

import { toggleRole } from "../../auth/queries";
import {
  createAuthCollections,
  loadTestUserAndOrg,
} from "../../auth/testutils";
import { createSet } from "../../css/queries/author_write";
import { db } from "../../db";
import { startDbContainer } from "../../testutils";
import { CrossSectionSetInputOwned } from "./author_read";

export async function loadTestSets() {
  const { default: testCsCreator } = await import("../../../seeds/test/2_cs");
  await testCsCreator();
}

export async function createCsCollections() {
  const { default: sharedCollectionsCreator } = await import(
    "../../../setup/3_shared"
  );
  await sharedCollectionsCreator();
  const { default: csCollectionsCreator } = await import("../../../setup/4_cs");
  await csCollectionsCreator();
}

export const ISO_8601_UTC = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d+Z$/i;

export async function startDbWithUserAndCssCollections() {
  const stopContainer = await startDbContainer();
  await createAuthCollections();
  await createCsCollections();
  const testKeys = await loadTestUserAndOrg();
  await toggleRole(testKeys.testUserKey, "author");

  return stopContainer;
}

export async function truncateCrossSectionSetCollections() {
  const collections2Truncate = [
    "Consumes",
    "CrossSectionSet",
    "CrossSectionSetHistory",
    "IsPartOf",
    "CrossSection",
    "CrossSectionHistory",
    "Reaction",
    "Produces",
    "Reference",
    "References",
    "State",
    "HasDirectSubstate",
  ];
  await Promise.all(
    collections2Truncate.map((c) => db().collection(c).truncate())
  );
}

export function sampleCrossSectionSet(): CrossSectionSetInputOwned {
  return {
    complete: false,
    contributor: "Some organization",
    name: "Some name",
    description: "Some description",
    references: {},
    states: {
      a: {
        particle: "A",
        charge: 0,
      },
      b: {
        particle: "B",
        charge: 1,
      },
      c: {
        particle: "C",
        charge: 2,
      },
    },
    processes: [
      {
        reaction: {
          lhs: [{ count: 1, state: "a" }],
          rhs: [{ count: 2, state: "b" }],
          reversible: false,
          type_tags: [],
        },
        threshold: 42,
        type: Storage.LUT,
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        data: [[1, 3.14e-20]],
        reference: [],
      },
      {
        reaction: {
          lhs: [{ count: 1, state: "a" }],
          rhs: [{ count: 3, state: "c" }],
          reversible: false,
          type_tags: [],
        },
        threshold: 13,
        type: Storage.LUT,
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        data: [[2, 5.12e-10]],
        reference: [],
      },
    ],
  };
}

export const sampleEmail = "somename@example.com";

export const sampleSets4Search = async () => {
  const states = {
    e: {
      particle: "e",
      charge: -1,
    },
    H2: {
      particle: "H2",
      charge: 0,
    },
    N2: {
      particle: "N2",
      charge: 0,
    },
    Arp: {
      particle: "Ar",
      charge: 1,
    },
    Ar: {
      particle: "Ar",
      charge: 0,
    },
  };
  await createTestSet(
    "H2 set",
    states.e,
    states.H2,
    [ReactionTypeTag.Effective],
    "Some organization"
  );
  await createTestSet(
    "N2 set",
    states.e,
    states.N2,
    [ReactionTypeTag.Effective],
    "Some other organization"
  );
  await createTestSet(
    "Ar set",
    states.Arp,
    states.Ar,
    [ReactionTypeTag.Ionization],
    "Some organization"
  );
};

async function createTestSet(
  name: string,
  c1: State<AnyAtomJSON | AnyMoleculeJSON>,
  c2: State<AnyAtomJSON | AnyMoleculeJSON>,
  type_tags: ReactionTypeTag[],
  contributor: string
) {
  await createSet({
    complete: false,
    contributor,
    name,
    description: "Some description",
    references: {},
    states: {
      c1,
      c2,
    },
    processes: [
      {
        reaction: {
          lhs: [
            { count: 1, state: "c1" },
            { count: 1, state: "c2" },
          ],
          rhs: [],
          reversible: false,
          type_tags,
        },
        threshold: 42,
        type: Storage.LUT,
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        data: [[1, 3.14e-20]],
        reference: [],
      },
    ],
  });
}
