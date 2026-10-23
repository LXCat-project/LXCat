// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LXCatDatabase } from "@lxcat/database";

let _db: LXCatDatabase | undefined = undefined;

export function rootDb() {
  if (_db === undefined) {
    _db = LXCatDatabase.init(
      process.env.ARANGO_URL!,
      process.env.ARANGO_DB,
      "root",
      process.env.ARANGO_ROOT_PASSWORD,
    );
  }

  return _db;
}

/**
 * Create the organizations when they do not exist, and make them the only
 * organizations the user is a member of. Returns the key of the user, to undo
 * this with `stripAffiliations`.
 */
export async function joinOrganizations(
  email: string,
  ...organizations: Array<string>
) {
  const db = rootDb();
  for (const organization of organizations) {
    await db.upsertOrganization(organization);
  }
  const userKey = (await db.getUserByEmail(email))!._key!;
  const organizationKeys = (await db.listOrganizations())
    .filter(({ name }) => organizations.includes(name))
    .map(({ _key }) => _key);
  await db.setAffiliations(userKey, organizationKeys);
  return userKey;
}
