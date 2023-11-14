// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Database } from "arangojs";
import testUserCreator from "../test/seed/1_users.js";

export interface TestKeys {
  testUserKey: string;
  testOrgKey: string;
}

export async function loadTestUserAndOrg(db: Database): Promise<TestKeys> {
  return await testUserCreator(db);
}
