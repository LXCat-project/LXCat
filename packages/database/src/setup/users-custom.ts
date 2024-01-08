// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "dotenv/config";
import { Database } from "arangojs";
import { CollectionType } from "arangojs/collection.js";
import { Result, Unit } from "true-myth";
import { err, ok } from "true-myth/result";
import { AsyncResult } from "../async-result.js";
import {
  OrganizationAsJsonSchema,
  UserWithAccountSessionInDb,
  UserWithAccountSessionInDbAsJsonSchema,
} from "../auth/schema.js";
import { ArangoError } from "../error.js";

// NOTE: This uses a custom `AsyncResult` implementation wrapping `Result` from true-myth.
export const setupUserCollections = (
  db: Database,
): AsyncResult<Unit, Error> =>
  new AsyncResult(createUserCollection(db))
    .andThen(() => createOrganizationCollection(db))
    .andThen(() => createMemberOfCollection(db));
export default setupUserCollections;

const createUserCollection = async (
  db: Database,
): Promise<Result<Unit, Error>> => {
  const users = db.collection<UserWithAccountSessionInDb>("users");
  if (await users.exists()) {
    return err(ArangoError("The User collection already exists"));
  }
  await users.create({
    schema: {
      rule: UserWithAccountSessionInDbAsJsonSchema,
    },
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
