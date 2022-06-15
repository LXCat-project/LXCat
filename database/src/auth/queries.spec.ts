import { describe, beforeAll, afterAll, it, expect } from 'vitest'

import { StartedArangoContainer } from "testcontainers";
import { startDbContainer } from "../testutils";
import {
  getUserByKey,
  listUsers,
  toggleRole,
  makeMemberless,
  makeMember,
  listOrganizations,
} from "./queries";
import { TestKeys, createTestUserAndOrg } from "./testutils";

describe("given filled ArangoDB container", () => {
  let container: StartedArangoContainer;
  let testKeys: TestKeys;
  beforeAll(async () => {
    container = await startDbContainer();
    testKeys = await createTestUserAndOrg();
  });

  afterAll(async () => {
    await container.stop();
  });

  it("should have a single user", async () => {
    const result = await listUsers();
    const expected = {
      _key: testKeys.testUserKey,
      email: "somename@example.com",
      name: "somename",
      organization: "Some organization",
      roles: [],
    };
    expect(result).toEqual([expected]);
  });

  it("should have a single org", async () => {
    const result = await listOrganizations();
    const expected = {
      _key: testKeys.testOrgKey,
      name: "Some organization",
    };
    expect(result).toEqual([expected]);
  });

  describe("toggleRole()", () => {
    describe("given no roles", () => {
      describe("toggle role=admin", () => {
        beforeAll(async () => {
          await toggleRole(testKeys.testUserKey, "admin");
        });

        afterAll(async () => {
          await toggleRole(testKeys.testUserKey, "admin");
        });

        it("should have admin role", async () => {
          const user = await getUserByKey(testKeys.testUserKey);
          expect(new Set(user && user.roles)).toEqual(new Set(["admin"]));
        });
      });
    });
  });

  describe("given member of some organization", () => {
    describe("makeMemberless()", () => {
      beforeAll(async () => {
        await makeMemberless(testKeys.testUserKey);
      });

      afterAll(async () => {
        await makeMember(testKeys.testUserKey, testKeys.testOrgKey);
      });

      it("should have no org", async () => {
        const users = await listUsers();
        const expected = {
          _key: testKeys.testUserKey,
          email: "somename@example.com",
          name: "somename",
          organization: null,
          roles: [],
        };
        expect(users).toEqual([expected]);
      });
    });
  });
});
