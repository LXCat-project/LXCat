// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "dotenv/config";
import { Database } from "arangojs";
import { CollectionType } from "arangojs/collection";
import {
  OrganizationAsJsonSchema,
  UserWithAccountSessionInDb,
  UserWithAccountSessionInDbAsJsonSchema,
} from "../auth/schema";

export const setupUserCollections = async (db: Database) => {
  await createUserCollection(db);
  await createOrganizationCollection(db);
  await createMemberOfCollection(db);
};

const createUserCollection = async (db: Database) => {
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
};

const createOrganizationCollection = async (db: Database) => {
  const organizations = db.collection<UserWithAccountSessionInDb>(
    "Organization",
  );
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
};

const createMemberOfCollection = async (db: Database) => {
  // Stores which Users are members of which Organization
  const collection = db.collection("MemberOf");
  if (await collection.exists()) {
    console.log("MemberOf collection already exists");
    return;
  }
  await collection.create({ type: CollectionType.EDGE_COLLECTION });
  console.log("MemberOf collection created");
};
