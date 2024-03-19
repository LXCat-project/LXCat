// SPDX-FileCopyrightText: LXCat team

// SPDX-License-Identifier: AGPL-3.0-or-later
import "dotenv/config";
import { Contributor } from "@lxcat/schema";
import { Database } from "arangojs";
import { EdgeCollection } from "arangojs/collection.js";
import { UserWithAccountSessionInDb } from "../../auth/schema.js";

export default async (db: Database) => {
  const users = db.collection<UserWithAccountSessionInDb>("users");
  const user = UserWithAccountSessionInDb.parse({
    name: "somename",
    email: "somename@example.com",
  });
  const newUser = await users.save(user, {
    returnNew: true,
  });
  // TODO hide logs of seed behind a flag
  console.log(`Test user added with _key = ${newUser._key}`);

  const organizations = db.collection<Contributor>("Organization");
  const organization: Contributor = {
    name: "Some organization",
    description: "Description of some organization.",
    contact: "info@some-org.com",
    howToReference: "",
  };
  const newOrganization = await organizations.save(organization, {
    returnNew: true,
  });
  console.log(`Test organization added with _key = ${newOrganization._key}`);

  const memberships: EdgeCollection = db.collection("MemberOf");
  await memberships.save({
    _from: newUser._id,
    _to: newOrganization._id,
  });
  console.log("Test user member of test organization");
  return {
    testUserKey: newUser._key,
    testOrgKey: newOrganization._key,
  };
};
