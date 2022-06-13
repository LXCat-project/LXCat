import "dotenv/config";
import { db } from "../src/db";
import {
  OrganizationAsJsonSchema,
  UserWithAccountSessionInDb,
  UserWithAccountSessionInDbAsJsonSchema,
} from "../src/auth/schema";
import { CollectionType } from "arangojs/collection";

export default async function () {
  await createUserCollection();
  await createOrganizationCollection();
  await createMemberOfCollection();
}

async function createUserCollection() {
  const users = db.collection<UserWithAccountSessionInDb>("users");
  if (await users.exists()) {
    console.log("Users collection already exists");
    return;
  }
  await users.create({
    schema: {
      rule: UserWithAccountSessionInDbAsJsonSchema,
    },
  });
  await Promise.all([
    users.ensureIndex({ type: "persistent", fields: ["email"], unique: true }),
    users.ensureIndex({
      type: "persistent",
      fields: ["accounts[*].provider", "accounts[*].providerAccountId"],
      unique: true,
    }),
    users.ensureIndex({
      type: "persistent",
      fields: ["session[*].sessionToken"],
      unique: true,
    }),
  ]);
  console.log("Users collection created");
}

async function createOrganizationCollection() {
  const organizations =
    db.collection<UserWithAccountSessionInDb>("Organization");
  if (await organizations.exists()) {
    console.log("Organization collection already exists");
    return;
  }
  await organizations.create({
    schema: {
      rule: OrganizationAsJsonSchema,
    },
  });
  await organizations.ensureIndex({
    type: "persistent",
    fields: ["name"],
    unique: true,
  });
  console.log("Organization collection created");
}

async function createMemberOfCollection() {
  // Stores which Users are members of which Organization
  const collection = db.collection("MemberOf");
  if (await collection.exists()) {
    console.log("MemberOf collection already exists");
    return;
  }
  await collection.create({ type: CollectionType.EDGE_COLLECTION });
  console.log("MemberOf collection created");
}
