import { CollectionType } from "arangojs/collection";
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
  await createCrossSectionHistoryCollection();
  await createCrossSectionSetHistoryCollection();
}

async function createCrossSectionSetCollection() {
  const collection = db.collection("CrossSectionSet");
  await collection.create({
    schema: {
      rule: CrossSectionSetIndbAsJsonSchema,
    },
  });
  await Promise.all([
    collection.ensureIndex({ type: "persistent", fields: ["name"], unique: true }),
    collection.ensureIndex({ type: "persistent", fields: ["organization"] }),
    collection.ensureIndex({ type: "persistent", fields: ["versionInfo.status"] }),
  ])
  console.log("CrossSectionSet collection created");
}

async function createCrossSectionCollection() {
  const collection = db.collection("CrossSection");
  await collection.create({
    schema: {
      rule: CrossSectionIndbAsJsonSchema,
    },
  });
  await Promise.all([
    collection.ensureIndex({ type: "persistent", fields: ["reaction"] }),
    collection.ensureIndex({ type: "persistent", fields: ["organization"] }),
    collection.ensureIndex({ type: "persistent", fields: ["versionInfo.status"] }),
  ])
  console.log("CrossSection collection created");
}

async function createEdgeCollections() {
  for (const name of Object.values(Relation)) {
    await db.createEdgeCollection(name);
    console.log(`${name} edge collection created`);
  }
}

async function createCrossSectionHistoryCollection() {
  const collection = db.collection('CrossSectionHistory')
  if ((await collection.exists())) {
      console.log('CrossSectionHistory collection already exists')
      return;
  }
  await collection.create({ type: CollectionType.EDGE_COLLECTION })
  console.log('CrossSectionHistory collection created')
}

async function createCrossSectionSetHistoryCollection() {
  const collection = db.collection('CrossSectionSetHistory')
  if ((await collection.exists())) {
      console.log('CrossSectionSetHistory collection already exists')
      return;
  }
  await collection.create({ type: CollectionType.EDGE_COLLECTION })
  console.log('CrossSectionSetHistory collection created')
}