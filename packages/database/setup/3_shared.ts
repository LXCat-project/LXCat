// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "dotenv/config";
import { db } from "../src/db";
import ContributorIndbAsJsonSchema from "../src/shared/schemas/Contributor.schema.json" assert { type: "json" };
import ParticleIndbAsJsonSchema from "../src/shared/schemas/Particle.schema.json" assert { type: "json" };
import ReactionIndbAsJsonSchema from "../src/shared/schemas/Reaction.schema.json" assert { type: "json" };
import ReferenceIndbAsJsonSchema from "../src/shared/schemas/Reference.schema.json" assert { type: "json" };
import StateIndbAsJsonSchema from "../src/shared/schemas/State.schema.json" assert { type: "json" };
import { Relation } from "../src/shared/schema";

export default async function () {
  await createParticleCollection();
  await createContributorCollection();
  await createReferenceCollection();
  await createStateCollection();
  await createReactionCollection();
  await createEdgeCollections();
}

async function createParticleCollection() {
  const collection = db().collection("Particle");
  await collection.create({
    schema: {
      rule: ParticleIndbAsJsonSchema,
    },
  });
  await collection.ensureIndex({
    fields: ["name"],
    type: "persistent",
    unique: true,
  });
  console.log("Particle collection created");
}

async function createContributorCollection() {
  const collection = db().collection("Contributor");
  await collection.create({
    schema: {
      rule: ContributorIndbAsJsonSchema,
    },
  });
  console.log("Contributor collection created");
}

async function createReferenceCollection() {
  const collection = db().collection("Reference");
  await collection.create({
    schema: {
      rule: ReferenceIndbAsJsonSchema,
    },
  });
  console.log("Reference collection created");
}

async function createStateCollection() {
  const collection = db().collection("State");
  await collection.create({
    schema: {
      rule: StateIndbAsJsonSchema,
    },
  });
  await collection.ensureIndex({
    fields: ["id"],
    type: "persistent",
    unique: true,
  });
  console.log("State collection created");
}

async function createReactionCollection() {
  const collection = db().collection("Reaction");
  await collection.create({
    schema: {
      rule: ReactionIndbAsJsonSchema,
    },
  });
  console.log("Reaction collection created");
}

async function createEdgeCollections() {
  for (const name of Object.values(Relation)) {
    await db().createEdgeCollection(name);
    console.log(`${name} edge collection created`);
  }
}
