// SPDX-FileCopyrightText: LXCat team

// SPDX-License-Identifier: AGPL-3.0-or-later

import "dotenv/config";
import { EdgeCollection } from "arangojs/collections";
import { dirname, join } from "path";
import { UserWithAccountSessionInDb } from "../../auth/schema.js";
import { load_organizations_dir } from "../../css/loaders.js";
import { LXCatTestDatabase } from "../index.js";

export default async (db: LXCatTestDatabase) => {
  const users = db.getDB().collection<UserWithAccountSessionInDb>("users");
  const user = UserWithAccountSessionInDb.parse({
    name: "somename",
    email: "somename@example.com",
  });
  const newUser = await users.save(user, {
    returnNew: true,
  });
  // TODO hide logs of seed behind a flag
  console.log(`Test user added with _key = ${newUser._key}`);

  const thisfile = new URL(import.meta.url);
  await load_organizations_dir(
    db,
    join(dirname(thisfile.pathname), "organizations"),
  );

  const orgId = await db.getOrganizationByName("Some organization");

  if (orgId === undefined) {
    throw new Error("Could not find test organization: Some organization.");
  }

  const memberships: EdgeCollection = db.getDB().collection("MemberOf");
  await memberships.save({
    _from: newUser._id,
    _to: orgId,
  });

  return {
    testUserKey: newUser._key,
    testOrgKey: orgId.split("/")[1],
  };
};
