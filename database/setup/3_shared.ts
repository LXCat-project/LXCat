import "dotenv/config";
import { db } from "../../app/src/db";
import {
  ContributorIndbAsJsonSchema,
  ParticleIndbAsJsonSchema,
  ReactionIndbAsJsonSchema,
  ReferenceIndbAsJsonSchema,
  Relation,
  StateIndbAsJsonSchema,
} from "../../app/src/shared/schema";

(async () => {
  await createParticleCollection();
  await createContributorCollection();
  await createReferenceCollection();
  await createStateCollection();
  await createReactionCollection()
  await createEdgeCollections()
})();

async function createParticleCollection() {
  const collection = db.collection("Particle");
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
  const collection = db.collection("Contributor");
  await collection.create({
    schema: {
      rule: ContributorIndbAsJsonSchema,
    },
  });
  console.log("Contributor collection created");
}

async function createReferenceCollection() {
  const collection = db.collection("Reference");
  await collection.create({
    schema: {
      rule: ReferenceIndbAsJsonSchema,
    },
  });
  console.log("Reference collection created");
}

async function createStateCollection() {
  const collection = db.collection("State");
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
    const collection = db.collection("Reaction");
    await collection.create({
      schema: {
        rule: ReactionIndbAsJsonSchema,
      },
    });
    console.log("Reaction collection created");
  }

async function createEdgeCollections() {
    for (const name of Object.values(Relation)) {
		await db.createEdgeCollection(name);
	}
}