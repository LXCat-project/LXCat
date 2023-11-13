// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "dotenv/config";
import { Database } from "arangojs";
import { Relation } from "../shared/schema";

export const setupSharedCollections = async (db: Database) => {
  await createParticleCollection(db);
  await createContributorCollection(db);
  await createReferenceCollection(db);
  await createStateCollection(db);
  await createReactionCollection(db);
  await createEdgeCollections(db);
};

const createParticleCollection = async (db: Database) => {
  const collection = db.collection("Particle");
  await collection.create({});
  await collection.ensureIndex({
    fields: ["name"],
    type: "persistent",
    unique: true,
  });
  console.log("Particle collection created");
};

const createContributorCollection = async (db: Database) => {
  const collection = db.collection("Contributor");
  await collection.create({});
  console.log("Contributor collection created");
};

const createReferenceCollection = async (db: Database) => {
  const collection = db.collection("Reference");
  await collection.create({});
  console.log("Reference collection created");
};

const createStateCollection = async (db: Database) => {
  const collection = db.collection("State");
  await collection.create({});
  // await collection.ensureIndex({
  //   fields: ["id"],
  //   type: "persistent",
  //   unique: true,
  // });
  console.log("State collection created");
};

const createReactionCollection = async (db: Database) => {
  const collection = db.collection("Reaction");
  await collection.create({});
  console.log("Reaction collection created");
};

const createEdgeCollections = async (db: Database) => {
  for (const name of Object.values(Relation)) {
    await db.createEdgeCollection(name);
    console.log(`${name} edge collection created`);
  }
};
