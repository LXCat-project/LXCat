// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "dotenv/config";
import { Database } from "arangojs";
import { CollectionType } from "arangojs/collection";
import { Result, Unit } from "true-myth";
import { err, ok } from "true-myth/result";
import {
  // OrganizationAsJsonSchema,
  UserWithAccountSessionInDb,
  // UserWithAccountSessionInDbAsJsonSchema,
} from "../auth/schema.js";
import { ArangoError } from "../error.js";

// TODO: The error handling here is rather unergonomic. We might benefit from switching to a
//       more complete functional programming library like fp-ts, purify-ts, or neverthrow.
export const setupUserCollections = async (
  db: Database,
): Promise<Result<Unit, Error>> => {
  const userResult = await createUserCollection(db);
  if (userResult.isErr) {
    return userResult;
  }

  const orgResult = await createOrganizationCollection(db);
  if (orgResult.isErr) {
    return orgResult;
  }

  return createMemberOfCollection(db);
};

const createUserCollection = async (
  db: Database,
): Promise<Result<Unit, Error>> => {
  const users = db.collection<UserWithAccountSessionInDb>("users");
  if (await users.exists()) {
    // The "users" collection is allowed to exist. This is required to get the
    // `drop-non-user` command to work.
    return ok();
  }
  await users.create({
    // schema: {
    //   rule: UserWithAccountSessionInDbAsJsonSchema,
    // },
  });
  await Promise.all([
    users.ensureIndex({
      type: "persistent",
      fields: ["email"],
      unique: true,
    }),
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

  console.log("User collection created");
  return ok();
};

const createOrganizationCollection = async (
  db: Database,
): Promise<Result<Unit, Error>> => {
  const organizations = db.collection<UserWithAccountSessionInDb>(
    "Organization",
  );
  if (await organizations.exists()) {
    return err(ArangoError("The Organization collection already exists"));
  }
  await organizations.create({
    // schema: {
    //   rule: OrganizationAsJsonSchema,
    // },
  });
  await organizations.ensureIndex({
    type: "persistent",
    fields: ["name"],
    unique: true,
  });

  console.log("Organization collection created");
  return ok();
};

const createMemberOfCollection = async (
  db: Database,
): Promise<Result<Unit, Error>> => {
  // Stores which Users are members of which Organization
  const collection = db.collection("MemberOf");
  if (await collection.exists()) {
    return err(ArangoError("The MemberOf collection already exists"));
  }
  await collection.create({ type: CollectionType.EDGE_COLLECTION });

  console.log("MemberOf collection created");
  return ok();
};
