// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CollectionType } from "arangojs/collection";
import "dotenv/config";
import { Relation } from "../src/cs/schema";
import CrossSectionIndbAsJsonSchema from "../src/cs/schemas/CrossSection.schema.json" assert {
  type: "json",
};
import CrossSectionSetIndbAsJsonSchema from "../src/css/schemas/CrossSectionSet.schema.json" assert {
  type: "json",
};
import { db } from "../src/db";

export default async function() {
  await createCrossSectionSetCollection();
  await createCrossSectionCollection();
  await createEdgeCollections();
  await createCrossSectionHistoryCollection();
  await createCrossSectionSetHistoryCollection();
}

async function createCrossSectionSetCollection() {
  const collection = db().collection("CrossSectionSet");
  await collection.create({
    schema: {
      rule: CrossSectionSetIndbAsJsonSchema,
    },
  });
  await Promise.all([
    collection.ensureIndex({ type: "persistent", fields: ["name"] }),
    collection.ensureIndex({ type: "persistent", fields: ["organization"] }),
    collection.ensureIndex({
      type: "persistent",
      fields: ["versionInfo.status"],
    }),
    collection.ensureIndex({
      type: "persistent",
      fields: ["organization", "name", "versionInfo.version"],
      unique: true,
    }),
  ]);
  console.log("CrossSectionSet collection created");
}

async function createCrossSectionCollection() {
  const collection = db().collection("CrossSection");
  await collection.create({
    schema: {
      rule: CrossSectionIndbAsJsonSchema,
    },
  });
  await Promise.all([
    collection.ensureIndex({ type: "persistent", fields: ["reaction"] }),
    collection.ensureIndex({ type: "persistent", fields: ["organization"] }),
    collection.ensureIndex({
      type: "persistent",
      fields: ["versionInfo.status"],
    }),
  ]);
  console.log("CrossSection collection created");
}

async function createEdgeCollections() {
  for (const name of Object.values(Relation)) {
    await db().createEdgeCollection(name);
    console.log(`${name} edge collection created`);
  }
}

async function createCrossSectionHistoryCollection() {
  const collection = db().collection("CrossSectionHistory");
  if (await collection.exists()) {
    console.log("CrossSectionHistory collection already exists");
    return;
  }
  await collection.create({ type: CollectionType.EDGE_COLLECTION });
  console.log("CrossSectionHistory collection created");
}

async function createCrossSectionSetHistoryCollection() {
  const collection = db().collection("CrossSectionSetHistory");
  if (await collection.exists()) {
    console.log("CrossSectionSetHistory collection already exists");
    return;
  }
  await collection.create({ type: CollectionType.EDGE_COLLECTION });
  console.log("CrossSectionSetHistory collection created");
}
