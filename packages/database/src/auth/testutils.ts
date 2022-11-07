// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export interface TestKeys {
  testUserKey: string;
  testOrgKey: string;
}

export async function loadTestUserAndOrg(): Promise<TestKeys> {
  const { default: testUserCreator } = await import("../../seeds/test/1_users");
  return await testUserCreator();
}
export async function createAuthCollections() {
  const { default: userCollectionCreator } = await import(
    "../../setup/2_users"
  );
  await userCollectionCreator();
}
