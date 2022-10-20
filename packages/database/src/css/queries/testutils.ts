import { AnyAtomJSON } from "@lxcat/schema/dist/core/atoms";
import { ReactionTypeTag, Storage } from "@lxcat/schema/dist/core/enumeration";
import { AnyMoleculeJSON } from "@lxcat/schema/dist/core/molecules";
import { State } from "@lxcat/schema/dist/core/state";
import { expect } from "vitest";

import { toggleRole } from "../../auth/queries";
import {
  createAuthCollections,
  loadTestUserAndOrg,
} from "../../auth/testutils";
import { createSet, deleteSet } from "../../css/queries/author_write";
import { db } from "../../db";
import { startDbContainer } from "../../testutils";
import { CrossSectionSetInputOwned } from "./author_read";
import { FilterOptions } from "./public";

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
export const matches8601 = expect.stringMatching(ISO_8601_UTC);

export const matchesId = expect.stringMatching(/\d+/);

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
  await createSet(
    setFrom(
      "H2 set",
      states.e,
      states.H2,
      [ReactionTypeTag.Effective],
      "Some organization"
    )
  );
  await createSet(
    setFrom(
      "N2 set",
      states.e,
      states.N2,
      [ReactionTypeTag.Effective],
      "Some other organization"
    )
  );
  await createSet(
    setFrom(
      "Ar set",
      states.Arp,
      states.Ar,
      [ReactionTypeTag.Ionization],
      "Some organization"
    )
  );
};

/**
 * Version = 2nd species:
 * 1. published = H2
 * 1. draft = N2
 * 1. retracted = Ar
 * 1. archived = CO2
 */
export const sampleSets4SearchWithVersions = async () => {
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
    CO2: {
      particle: "CO2",
      charge: 0,
    },
  };
  await createSet(
    setFrom(
      "H2 set",
      states.e,
      states.H2,
      [ReactionTypeTag.Effective],
      "Some published organization"
    ),
    "published"
  );
  await createSet(
    setFrom(
      "N2 set",
      states.e,
      states.N2,
      [ReactionTypeTag.Attachment],
      "Some draft organization"
    ),
    "draft"
  );
  const id2retract = await createSet(
    setFrom(
      "Ar set",
      states.Arp,
      states.Ar,
      [ReactionTypeTag.Ionization],
      "Some retracted organization"
    ),
    "published"
  );
  await deleteSet(id2retract, "Oops");
  await createSet(
    setFrom(
      "CO2 set",
      states.e,
      states.CO2,
      [ReactionTypeTag.Electronic],
      "Some archived organization"
    ),
    "archived"
  );
};

function setFrom(
  name: string,
  c1: State<AnyAtomJSON | AnyMoleculeJSON>,
  c2: State<AnyAtomJSON | AnyMoleculeJSON>,
  type_tags: ReactionTypeTag[],
  contributor: string
): CrossSectionSetInputOwned {
  return {
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
  };
}

export const emptySelection: Readonly<FilterOptions> = {
  state: { particle: {} },
  contributor: [],
  tag: [],
};
