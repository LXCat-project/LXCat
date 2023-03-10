// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AnyAtom } from "@lxcat/schema/dist/core/atoms";
import { CouplingScheme } from "@lxcat/schema/dist/core/atoms/coupling_scheme";

import { ReactionTypeTag, Storage } from "@lxcat/schema/dist/core/enumeration";
import { AnyMolecule } from "@lxcat/schema/dist/core/molecules";
import { Reaction } from "@lxcat/schema/dist/core/reaction";
import { State } from "@lxcat/schema/dist/core/state";
import { Dict, XOR } from "@lxcat/schema/dist/core/util";
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
    collections2Truncate.map((c) => db().collection(c).truncate()),
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
    "He{1S0}": {
      particle: "He",
      charge: 0,
      type: "AtomLS",
      electronic: [
        {
          config: [],
          scheme: CouplingScheme.LS,
          term: { L: 0, S: 0, J: 0, P: 1 },
        },
      ],
    },
    "He{*}": {
      particle: "He",
      charge: 0,
      type: "AtomLS",
      electronic: [{ e: "*" }],
    },
  };
  await createSet(
    setFrom(
      "H2 set",
      { e: states.e, H2: states.H2 },
      [
        {
          lhs: [
            { count: 1, state: "e" },
            { count: 1, state: "H2" },
          ],
          rhs: [
            { count: 1, state: "e" },
            { count: 1, state: "H2" },
          ],
          type_tags: [ReactionTypeTag.Effective],
          reversible: false,
        },
      ],
      "Some organization",
    ),
  );
  await createSet(
    setFrom(
      "N2 set",
      { e: states.e, N2: states.N2 },
      [
        {
          lhs: [
            { count: 1, state: "e" },
            { count: 1, state: "N2" },
          ],
          rhs: [
            { count: 1, state: "e" },
            { count: 1, state: "N2" },
          ],
          type_tags: [ReactionTypeTag.Effective],
          reversible: false,
        },
      ],
      "Some other organization",
    ),
  );
  await createSet(
    setFrom(
      "Ar set",
      { e: states.e, Ar: states.Ar, Arp: states.Arp },
      [
        {
          lhs: [
            { count: 1, state: "e" },
            { count: 1, state: "Ar" },
          ],
          rhs: [
            { count: 2, state: "e" },
            { count: 1, state: "Arp" },
          ],
          type_tags: [ReactionTypeTag.Ionization],
          reversible: false,
        },
      ],
      "Some organization",
    ),
  );
  await createSet(
    setFrom(
      "He set",
      { e: states.e, "He{1S0}": states["He{1S0}"], "He{*}": states["He{*}"] },
      [
        {
          lhs: [
            { count: 1, state: "e" },
            { count: 1, state: "He{1S0}" },
          ],
          rhs: [
            { count: 1, state: "e" },
            { count: 1, state: "He{*}" },
          ],
          type_tags: [ReactionTypeTag.Electronic],
          reversible: false,
        },
      ],
      "Some organization",
    ),
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
  const states: Dict<State<XOR<AnyAtom, AnyMolecule>>> = {
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
    "He{1S0}": {
      particle: "He",
      charge: 0,
      type: "AtomLS",
      electronic: [
        {
          config: [],
          scheme: CouplingScheme.LS,
          term: { L: 0, S: 0, J: 0, P: 1 },
        },
      ],
    },
    "He{*}": {
      particle: "He",
      charge: 0,
      type: "AtomLS",
      electronic: [{ e: "*" }],
    },
  };
  await createSet(
    setFrom(
      "H2 set",
      { e: states.e, H2: states.H2 },
      [
        {
          lhs: [
            { count: 1, state: "e" },
            { count: 1, state: "H2" },
          ],
          rhs: [
            { count: 1, state: "e" },
            { count: 1, state: "H2" },
          ],
          type_tags: [ReactionTypeTag.Effective],
          reversible: false,
        },
      ],
      "Some published organization",
    ),
    "published",
  );
  await createSet(
    setFrom(
      "N2 set",
      { e: states.e, N2: states.N2 },
      [
        {
          lhs: [
            { count: 1, state: "e" },
            { count: 1, state: "H2" },
          ],
          rhs: [
            { count: 1, state: "e" },
            { count: 1, state: "H2" },
          ],
          type_tags: [ReactionTypeTag.Effective],
          reversible: false,
        },
      ],
      "Some draft organization",
    ),
    "draft",
  );
  const id2retract = await createSet(
    setFrom(
      "Ar set",
      { e: states.e, Ar: states.Ar, Arp: states.Arp },
      [
        {
          lhs: [
            { count: 1, state: "e" },
            { count: 1, state: "Ar" },
          ],
          rhs: [
            { count: 2, state: "e" },
            { count: 1, state: "Arp" },
          ],
          type_tags: [ReactionTypeTag.Ionization],
          reversible: false,
        },
      ],
      "Some retracted organization",
    ),
    "published",
  );
  await deleteSet(id2retract, "Oops");
  await createSet(
    setFrom(
      "He set",
      { e: states.e, "He{1S0}": states["He{1S0}"], "He{*}": states["He{*}"] },
      [
        {
          lhs: [
            { count: 1, state: "e" },
            { count: 1, state: "He{1S0}" },
          ],
          rhs: [
            { count: 1, state: "e" },
            { count: 1, state: "He{*}" },
          ],
          type_tags: [ReactionTypeTag.Electronic],
          reversible: false,
        },
      ],
      "Some archived organization",
    ),
    "archived",
  );
};

function setFrom(
  name: string,
  states: Readonly<Dict<State<AnyAtom | AnyMolecule>>>,
  reactions: ReadonlyArray<Reaction<string>>,
  contributor: string,
): CrossSectionSetInputOwned {
  return {
    complete: false,
    contributor,
    name,
    description: "Some description",
    references: {},
    states,
    processes: reactions.map((reaction) => ({
      reaction,
      threshold: 0,
      type: Storage.LUT,
      labels: ["Energy", "Cross Section"],
      units: ["eV", "m^2"],
      data: [[0, 3.14e-20]],
      reference: [],
    })),
  };
}

export const emptySelection: Readonly<FilterOptions> = {
  state: { particle: {} },
  contributor: [],
  tag: [],
};
