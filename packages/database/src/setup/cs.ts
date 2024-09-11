// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CollectionType } from "arangojs/collection";
import "dotenv/config";
import { Database } from "arangojs";
import { Relation } from "../cs/schema.js";

export const setupCrossSectionCollections = async (db: Database) => {
  await createCrossSectionSetCollection(db);
  await createCrossSectionCollection(db);
  await createEdgeCollections(db);
  await createCrossSectionHistoryCollection(db);
  await createCrossSectionSetHistoryCollection(db);
};

const createCrossSectionSetCollection = async (db: Database) => {
  const collection = db.collection("CrossSectionSet");
  await collection.create({});
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
};

const createCrossSectionCollection = async (db: Database) => {
  const collection = db.collection("CrossSection");
  await collection.create({});
  await Promise.all([
    collection.ensureIndex({ type: "persistent", fields: ["reaction"] }),
    collection.ensureIndex({ type: "persistent", fields: ["organization"] }),
    collection.ensureIndex({
      type: "persistent",
      fields: ["versionInfo.status"],
    }),
  ]);
  console.log("CrossSection collection created");
};

const createEdgeCollections = async (db: Database) => {
  for (const name of Object.values(Relation)) {
    await db.createEdgeCollection(name);
    console.log(`${name} edge collection created`);
  }
};

const createCrossSectionHistoryCollection = async (db: Database) => {
  const collection = db.collection("CrossSectionHistory");
  if (await collection.exists()) {
    console.log("CrossSectionHistory collection already exists");
    return;
  }
  await collection.create({ type: CollectionType.EDGE_COLLECTION });
  console.log("CrossSectionHistory collection created");
};

const createCrossSectionSetHistoryCollection = async (db: Database) => {
  const collection = db.collection("CrossSectionSetHistory");
  if (await collection.exists()) {
    console.log("CrossSectionSetHistory collection already exists");
    return;
  }
  await collection.create({ type: CollectionType.EDGE_COLLECTION });
  console.log("CrossSectionSetHistory collection created");
};
