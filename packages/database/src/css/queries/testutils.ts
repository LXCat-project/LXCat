// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LTPDocument } from "@lxcat/schema";
import type { Reaction } from "@lxcat/schema/process";
import { AnySpecies } from "@lxcat/schema/species";
import { expect } from "vitest";
import { z } from "zod";
import { toggleRole } from "../../auth/queries";
import {
  createAuthCollections,
  loadTestUserAndOrg,
} from "../../auth/testutils";
import { createSet, deleteSet } from "../../css/queries/author_write";
import { db } from "../../db";
import { startDbContainer } from "../../testutils";
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

export function sampleCrossSectionSet(): z.input<typeof LTPDocument> {
  return {
    $schema: "",
    url: "",
    termsOfUse: "",
    complete: false,
    contributor: "Some organization",
    name: "Some name",
    description: "Some description",
    references: {},
    states: {
      a: {
        type: "simple",
        particle: "A",
        charge: 0,
      },
      b: {
        type: "simple",
        particle: "B",
        charge: 1,
      },
      c: {
        type: "simple",
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
          typeTags: [],
        },
        info: {
          type: "CrossSection",
          threshold: 42,
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[1, 3.14e-20]],
          },
          references: [],
        },
      },
      {
        reaction: {
          lhs: [{ count: 1, state: "a" }],
          rhs: [{ count: 3, state: "c" }],
          reversible: false,
          typeTags: [],
        },
        info: {
          type: "CrossSection",
          threshold: 13,
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[2, 5.12e-10]],
          },
          references: [],
        },
      },
    ],
  };
}

export const sampleEmail = "somename@example.com";

export const sampleSets4Search = async () => {
  const states: Record<string, AnySpecies> = {
    e: {
      type: "simple",
      particle: "e",
      charge: -1,
    },
    H2: {
      type: "simple",
      particle: "H2",
      charge: 0,
    },
    N2: {
      type: "simple",
      particle: "N2",
      charge: 0,
    },
    Arp: {
      type: "simple",
      particle: "Ar",
      charge: 1,
    },
    Ar: {
      type: "simple",
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
          term: { L: 0, S: 0, J: 0, P: 1 },
        },
      ],
    },
    "He{*}": {
      particle: "He",
      charge: 0,
      type: "unspecified",
      electronic: "*",
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
          typeTags: ["Effective"],
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
          typeTags: ["Effective"],
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
          typeTags: ["Ionization"],
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
          typeTags: ["Electronic"],
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
  const states: Record<string, AnySpecies> = {
    e: {
      type: "simple",
      particle: "e",
      charge: -1,
    },
    H2: {
      type: "simple",
      particle: "H2",
      charge: 0,
    },
    N2: {
      type: "simple",
      particle: "N2",
      charge: 0,
    },
    Arp: {
      type: "simple",
      particle: "Ar",
      charge: 1,
    },
    Ar: {
      type: "simple",
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
          term: { L: 0, S: 0, J: 0, P: 1 },
        },
      ],
    },
    "He{*}": {
      particle: "He",
      charge: 0,
      type: "unspecified",
      electronic: "*",
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
          typeTags: ["Effective"],
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
          typeTags: ["Effective"],
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
          typeTags: ["Ionization"],
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
          typeTags: ["Electronic"],
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
  states: Readonly<Record<string, AnySpecies>>,
  reactions: ReadonlyArray<Reaction<string>>,
  contributor: string,
) {
  return LTPDocument.parse(
    {
      $schema: "",
      url: "",
      termsOfUse: "",
      complete: false,
      contributor,
      name,
      description: "Some description",
      references: {},
      states,
      processes: reactions.map((reaction) => ({
        reaction,
        info: {
          type: "CrossSection",
          threshold: 0,
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[0, 3.14e-20]],
          },
          references: [],
        },
      })),
    },
  );
}

export const emptySelection: Readonly<FilterOptions> = {
  state: { particle: {} },
  contributor: [],
  tag: [],
};
