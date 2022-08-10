import { Storage } from "@lxcat/schema/dist/core/enumeration";
import { db } from "../../db";
import { toggleRole } from "../../auth/queries";
import {
  createAuthCollections,
  loadTestUserAndOrg,
} from "../../auth/testutils";
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
