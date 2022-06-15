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
