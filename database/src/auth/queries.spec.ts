import { StartedArangoContainer } from "testcontainers";
import { startDbContainer } from "../db.spec";
import {
  getUserByKey,
  listUsers,
  toggleRole,
  makeMemberless,
  makeMember,
} from "./queries";

describe("given filled ArangoDB container", () => {
  jest.setTimeout(180_000);

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

export interface TestKeys {
  testUserKey: string;
  testOrgKey: string;
}

export async function createTestUserAndOrg(): Promise<TestKeys> {
  const { default: userCollectionCreator } = await import(
    "../../setup/2_users"
  );
  await userCollectionCreator();
  const { default: testUserCreator } = await import("../../seeds/test/1_users");
  return await testUserCreator();
}
