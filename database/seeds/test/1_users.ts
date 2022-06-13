import "dotenv/config";
import { db } from "../../src/db";
import {
  Organization,
  UserWithAccountSessionInDb,
} from "../../src/auth/schema";
import { EdgeCollection } from "arangojs/collection";

export default async function () {
  const users = db.collection<UserWithAccountSessionInDb>("users");
  const user = UserWithAccountSessionInDb.parse({
    name: "somename",
    email: "somename@example.com",
  });
  const newUser = await users.save(user, {
    returnNew: true,
  });
  console.log(`Test user added with _key = ${newUser._key}`);

  const organizations = db.collection<Organization>("Organization");
  const organization = Organization.parse({
    name: "Some organization",
  });
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
}
