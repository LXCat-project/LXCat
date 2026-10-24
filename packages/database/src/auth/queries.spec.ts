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

  describe("API tokens", () => {
    const token = (jti: string, expires: string) => ({
      jti,
      createdOn: "2026-01-01T00:00:00.000Z",
      expires,
    });
    const nextYear = "2027-01-01T00:00:00.000Z";
    let userKey: string;

    beforeAll(async () => {
      userKey = (await db.addUser({
        email: "tokens@example.com",
        roles: [],
        accounts: [],
        sessions: [],
      }))!;
      await db.addApiToken(userKey, token("first", nextYear));
    });

    afterAll(async () => {
      await db.dropUser(userKey);
    });

    it("should find the user of a stored token", async () => {
      const user = await db.getUserByApiToken(userKey, "first");
      expect(user?._key).toEqual(userKey);
      expect(user?.email).toEqual("tokens@example.com");
    });

    it("should not find an unknown token", async () => {
      expect(await db.getUserByApiToken(userKey, "unknown")).toBeUndefined();
    });

    it("should not find the token under the key of another user", async () => {
      expect(await db.getUserByApiToken(testKeys.testUserKey, "first"))
        .toBeUndefined();
    });

    it("should find every stored token of a user", async () => {
      await db.addApiToken(userKey, token("second", nextYear));

      expect(await db.getUserByApiToken(userKey, "first")).toBeDefined();
      expect(await db.getUserByApiToken(userKey, "second")).toBeDefined();
    });

    it("should drop expired tokens when adding a token", async () => {
      await db.addApiToken(
        userKey,
        token("expired", "2026-01-02T00:00:00.000Z"),
      );
      expect(await db.getUserByApiToken(userKey, "expired")).toBeDefined();

      // Created after the expiry of the previous token.
      await db.addApiToken(userKey, {
        ...token("third", nextYear),
        createdOn: "2026-06-01T00:00:00.000Z",
      });

      expect(await db.getUserByApiToken(userKey, "expired")).toBeUndefined();
      expect(await db.getUserByApiToken(userKey, "third")).toBeDefined();
      expect(await db.getUserByApiToken(userKey, "first")).toBeDefined();
    });

    it("should not return the tokens in user queries", async () => {
      const users = [
        await db.getUserByKey(userKey),
        await db.getUserByEmail("tokens@example.com"),
        await db.getUserByApiToken(userKey, "first"),
        ...(await db.listUsers()).filter(({ _key }) => _key === userKey),
      ];

      expect(users).toHaveLength(4);
      for (const user of users) {
        expect(user).toBeDefined();
        expect(user).not.toHaveProperty("apiTokens");
      }
    });

    it("should lose the tokens with the user", async () => {
      const otherKey = (await db.addUser({
        email: "gone@example.com",
        roles: [],
        accounts: [],
        sessions: [],
      }))!;
      await db.addApiToken(otherKey, token("gone", nextYear));
      expect(await db.getUserByApiToken(otherKey, "gone")).toBeDefined();

      await db.dropUser(otherKey);

      expect(await db.getUserByApiToken(otherKey, "gone")).toBeUndefined();
    });
  });
});
