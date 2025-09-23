// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import testUserCreator from "../test/seed/1_users.js";
import { LXCatTestDatabase } from "../testutils.js";

export interface TestKeys {
  testUserKey: string;
  testOrgKey: string;
}

export async function loadTestUserAndOrg(
  db: LXCatTestDatabase,
): Promise<TestKeys> {
  return await testUserCreator(db);
}
