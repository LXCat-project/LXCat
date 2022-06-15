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
