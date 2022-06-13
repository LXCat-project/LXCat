import { StartedArangoContainer } from "testcontainers";
import { toggleRole } from "../auth/queries";
import { createTestUserAndOrg, TestKeys } from "../auth/queries.spec";
import { startDbContainer } from "../db.spec";
import { search, SortOptions } from "./queries";

describe("given filled ArangoDB container", () => {
  jest.setTimeout(180_000);

  let container: StartedArangoContainer;
  let testKeys: TestKeys;
  beforeAll(async () => {
    container = await startDbContainer();
    testKeys = await createTestUserAndOrg();
    await toggleRole(testKeys.testUserKey, "author");
    await createTestSets();
  });

  afterAll(async () => {
    await container.stop();
  });

  describe("search()", () => {
    describe("given no filter", () => {
      it("should have 2 sets", async () => {
        const filter = { contributor: [], species2: [] };
        const sort: SortOptions = { field: "name", dir: "DESC" };
        const paging = { offset: 0, count: 10 };
        const result = await search(filter, sort, paging);
        expect(result.length).toEqual(2);
      });
    });
  });
});

export async function createTestSets() {
  const { default: sharedCollectionsCreator } = await import(
    "../../setup/3_shared"
  );
  await sharedCollectionsCreator();
  const { default: csCollectionsCreator } = await import("../../setup/4_cs");
  await csCollectionsCreator();
  const { default: testCsCreator } = await import("../../seeds/test/2_cs");
  await testCsCreator();
}
