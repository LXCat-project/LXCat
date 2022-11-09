// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, beforeAll, afterAll, it, expect } from "vitest";

import { startDbContainer } from "../testutils";
import {
  getUserByKey,
  listUsers,
  toggleRole,
  makeMemberless,
  setMembers,
  listOrganizations,
  addOrganization,
  dropOrganization,
  userMemberships,
} from "./queries";
import {
  TestKeys,
  loadTestUserAndOrg,
  createAuthCollections,
} from "./testutils";

describe("given filled ArangoDB container", () => {
  let testKeys: TestKeys;
  beforeAll(async () => {
    const stopContainer = await startDbContainer();
    await createAuthCollections();
    testKeys = await loadTestUserAndOrg();
    return stopContainer;
  });

  it("should have a single user", async () => {
    const result = await listUsers();
    const expected = {
      _key: testKeys.testUserKey,
      email: "somename@example.com",
      name: "somename",
      organizations: ["Some organization"],
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

  it("should list organization in users memberships", async () => {
    const result = await userMemberships("somename@example.com");
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
        await setMembers(testKeys.testUserKey, [testKeys.testOrgKey]);
      });

      it("should have no org", async () => {
        const users = await listUsers();
        const expected = {
          _key: testKeys.testUserKey,
          email: "somename@example.com",
          name: "somename",
          organizations: [],
          roles: [],
        };
        expect(users).toEqual([expected]);
      });
    });
  });

  describe("addOrganization()", () => {
    let orgKey: string | undefined = "";
    beforeAll(async () => {
      orgKey = await addOrganization({ name: "some new org" });
    });

    afterAll(async () => {
      if (orgKey) {
        await dropOrganization(orgKey);
      }
    });

    it("after add should have new org in list", async () => {
      const orgs = await listOrganizations();
      expect(orgs).toContainEqual({ name: "some new org", _key: orgKey });
    });
  });
});
