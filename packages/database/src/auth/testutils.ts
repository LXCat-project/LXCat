// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Database } from "arangojs";

export interface TestKeys {
  testUserKey: string;
  testOrgKey: string;
}

export async function loadTestUserAndOrg(db: Database): Promise<TestKeys> {
  const { default: testUserCreator } = await import("../../seeds/test/1_users");
  return await testUserCreator(db);
}
export async function createAuthCollections(db: Database) {
  const { default: userCollectionCreator } = await import(
    "../../setup/2_users"
  );
  await userCollectionCreator(db);
}
