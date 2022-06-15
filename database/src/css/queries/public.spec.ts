import { StartedArangoContainer } from "testcontainers";
import { toggleRole } from "../../auth/queries";
import { createTestUserAndOrg, TestKeys } from "../../auth/testutils";
import { startDbContainer } from "../../testutils";
import { CrossSectionSetHeading } from "../public";
import { createCsCollections, loadTestSets } from "./testutils";
import { search, SortOptions } from "./public";

describe("given filled ArangoDB container", () => {
  jest.setTimeout(180_000);

  let container: StartedArangoContainer;
  let testKeys: TestKeys;
  beforeAll(async () => {
    container = await startDbContainer();
    testKeys = await createTestUserAndOrg();
    await toggleRole(testKeys.testUserKey, "author");
    await createCsCollections();
    await loadTestSets();
  });

  afterAll(async () => {
    await container.stop();
  });

  describe("search()", () => {
    describe("given no filter", () => {
      let result: CrossSectionSetHeading[] = [];

      beforeAll(async () => {
        const filter = { contributor: [], species2: [] };
        const sort: SortOptions = { field: "name", dir: "DESC" };
        const paging = { offset: 0, count: 10 };
        result = await search(filter, sort, paging);
      });

      it("should have 2 sets", () => {
        expect(result.length).toEqual(2);
      });
    });
  });
});
