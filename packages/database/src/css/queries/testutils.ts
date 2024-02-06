// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LTPDocument } from "@lxcat/schema";
import type { Reaction } from "@lxcat/schema/process";
import { AnySpecies } from "@lxcat/schema/species";
import { Database } from "arangojs";
import { expect } from "vitest";
import { z } from "zod";
import { LXCatDatabase } from "../../lxcat-database.js";
import { LXCatTestDatabase } from "../../testutils.js";

import testCsCreator from "../../test/seed/2_cs.js";
import { FilterOptions } from "../public.js";

export async function loadTestSets(db: LXCatDatabase) {
  await testCsCreator(db);
}

export const ISO_8601_UTC = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d+Z$/i;
export const matches8601 = expect.stringMatching(ISO_8601_UTC);

export const matchesId = expect.stringMatching(/\d+/);

export async function truncateCrossSectionSetCollections(db: Database) {
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
    collections2Truncate.map((c) => db.collection(c).truncate()),
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
    references: {
      main: {
        id: "main",
        type: "article",
        title: "Test reference title",
      },
    },
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
        info: [{
          type: "CrossSection",
          threshold: 42,
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[1, 3.14e-20]],
          },
          references: ["main"],
        }],
      },
      {
        reaction: {
          lhs: [{ count: 1, state: "a" }],
          rhs: [{ count: 3, state: "c" }],
          reversible: false,
          typeTags: [],
        },
        info: [{
          type: "CrossSection",
          threshold: 13,
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[2, 5.12e-10]],
          },
          references: [{
            id: "main",
            comments: [
              "Comment to e.g. highlight a specific location in the corresponding reference.",
            ],
          }],
        }],
      },
    ],
  };
}

export const sampleEmail = "somename@example.com";

export const sampleSets4Search = async (db: LXCatTestDatabase) => {
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
      electronic: {
        config: [],
        term: { L: 0, S: 0, J: 0, P: 1 },
      },
    },
    "He{*}": {
      particle: "He",
      charge: 0,
      type: "unspecified",
      electronic: "*",
    },
  };
  await db.createSet(
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
  await db.createSet(
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
  await db.createSet(
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
  await db.createSet(
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
export const sampleSets4SearchWithVersions = async (db: LXCatTestDatabase) => {
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
      electronic: {
        config: [],
        term: { L: 0, S: 0, J: 0, P: 1 },
      },
    },
    "He{*}": {
      particle: "He",
      charge: 0,
      type: "unspecified",
      electronic: "*",
    },
  };
  await db.createSet(
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
  await db.createSet(
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
      "Some draft organization",
    ),
    "draft",
  );
  const id2retract = await db.createSet(
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
  await db.deleteSet(id2retract, "Oops");
  await db.createSet(
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
      $schema: "http://www.schema.com",
      url: "http://www.url.com",
      termsOfUse: "http://www.terms-of-use.com",
      complete: false,
      contributor,
      name,
      description: "Some description",
      references: {},
      states,
      processes: reactions.map((reaction) => ({
        reaction,
        info: [{
          type: "CrossSection",
          threshold: 0,
          data: {
            type: "LUT",
            labels: ["Energy", "Cross Section"],
            units: ["eV", "m^2"],
            values: [[0, 3.14e-20]],
          },
          references: [],
        }],
      })),
    },
  );
}

export const emptySelection: Readonly<FilterOptions> = {
  state: { particle: {} },
  contributor: [],
  tag: [],
};
