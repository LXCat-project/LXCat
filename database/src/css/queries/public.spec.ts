import { describe, beforeAll, it, expect } from "vitest";

import { toggleRole } from "../../auth/queries";
import {
  createAuthCollections,
  loadTestUserAndOrg,
} from "../../auth/testutils";
import { startDbContainer } from "../../testutils";
import { CrossSectionSetHeading } from "../public";
import { createCsCollections, loadTestSets } from "./testutils";
import { search, SortOptions } from "./public";

describe("given filled ArangoDB container", () => {
  beforeAll(async () => {
    const stopContainer = await startDbContainer();
    await createAuthCollections();
    await createCsCollections();
    const testKeys = await loadTestUserAndOrg();
    await toggleRole(testKeys.testUserKey, "author");
    await loadTestSets();
    return stopContainer;
  });

  describe("search()", () => {
    describe("given no filter", () => {
      let result: CrossSectionSetHeading[] = [];

      beforeAll(async () => {
        const filter = { contributor: [], state: {particle: {}}, tag: [] };
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
