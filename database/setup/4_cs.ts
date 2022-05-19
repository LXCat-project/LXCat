import "dotenv/config";
import { db } from "../../app/src/db";
import {
  CrossSectionIndbAsJsonSchema,
  Relation,
} from "../../app/src/ScatteringCrossSection/schema";
import {
  CrossSectionSetIndbAsJsonSchema,
} from "../../app/src/ScatteringCrossSectionSet/schema";

export default async function () {
  await createCrossSectionSetCollection();
  await createCrossSectionCollection();
  await createEdgeCollections();
}

async function createCrossSectionSetCollection() {
  const collection = db.collection("CrossSectionSet");
  await collection.create({
    schema: {
      rule: CrossSectionSetIndbAsJsonSchema,
    },
  });
  // TODO add index on name, as it is used in search function
  console.log("CrossSectionSet collection created");
}

async function createCrossSectionCollection() {
  const collection = db.collection("CrossSection");
  await collection.create({
    schema: {
      rule: CrossSectionIndbAsJsonSchema,
    },
  });
  // TODO add index on reaction.lhs[*].state.id, as it is used in search function
  console.log("CrossSection collection created");
}

async function createEdgeCollections() {
  for (const name of Object.values(Relation)) {
    await db.createEdgeCollection(name);
  }
}
