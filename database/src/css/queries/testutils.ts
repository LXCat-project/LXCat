import { db } from "../../db";
import { toggleRole } from "../../auth/queries";
import {
  createAuthCollections,
  loadTestUserAndOrg,
} from "../../auth/testutils";
import { startDbContainer } from "../../testutils";

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
  ];
  await Promise.all(
    collections2Truncate.map((c) => db().collection(c).truncate())
  );
}
