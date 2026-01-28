// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { afterAll, beforeAll, describe, expect, it } from "bun:test";

import { systemDb } from "../system-db.js";
import { LXCatTestDatabase } from "../testutils.js";
import { loadTestUserAndOrg, TestKeys } from "./testutils.js";

describe("given filled ArangoDB container", () => {
  let db: LXCatTestDatabase;
  let testKeys: TestKeys;

  beforeAll(async () => {
    db = await LXCatTestDatabase.createTestInstance(systemDb(), "auth-test");
    testKeys = await loadTestUserAndOrg(db);
  });

  afterAll(async () => systemDb().dropDatabase("auth-test"));

  it("should have a single user", async () => {
    const result = await db.listUsers();
    const expected = {
      _key: testKeys.testUserKey,
      email: "somename@example.com",
      name: "somename",
      organizations: ["Some organization"],
      roles: [],
    };
    expect(result).toEqual([expected]);
  });

  it("should have two organizations", async () => {
    const result = await db.listOrganizations();
    expect(result.length).toEqual(2);
  });

  it("should list organization in users memberships", async () => {
    const result = await db.getAffiliations("somename@example.com");
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
          await db.toggleRole(testKeys.testUserKey, "admin");
        });

        afterAll(async () => {
          await db.toggleRole(testKeys.testUserKey, "admin");
        });

        it("should have admin role", async () => {
          const user = await db.getUserByKey(testKeys.testUserKey);
          expect(new Set(user && user.roles)).toEqual(new Set(["admin"]));
        });
      });
    });
  });

  describe("given member of some organization", () => {
    describe("makeMemberless()", () => {
      beforeAll(async () => {
        await db.stripAffiliations(testKeys.testUserKey);
      });

      afterAll(async () => {
        await db.setAffiliations(testKeys.testUserKey, [testKeys.testOrgKey]);
      });

      it("should have no org", async () => {
        const users = await db.listUsers();
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
      const result = await db.addOrganization({
        name: "some new org",
        description: "description of some new org",
        contact: "test@email.com",
        howToReference: "",
      });

      if (result.isOk) {
        orgKey = result.value;
      }
    });

    afterAll(async () => {
      if (orgKey) {
        await db.dropOrganization(orgKey);
      }
    });

    it("after add should have new org in list", async () => {
      const orgs = await db.listOrganizations();
      expect(orgs).toContainEqual({ name: "some new org", _key: orgKey! });
    });
  });
});
