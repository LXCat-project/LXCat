import 'dotenv/config'
import { db } from "../../app/src/db";
import { CrossSectionIndbAsJsonSchema, CrossSectionSetIndbAsJsonSchema, Relation } from "../../app/src/ScatteringCrossSection/schema"

export default async function() {
  await createCrossSectionSetCollection()
    await createCrossSectionCollection()
    await createEdgeCollections()
}

async function createCrossSectionSetCollection() {
    const collection = db.collection("CrossSectionSet");
    await collection.create({
      schema: {
        rule: CrossSectionSetIndbAsJsonSchema,
      },
    });
    console.log("CrossSectionSet collection created");
  }

  async function createCrossSectionCollection() {
    const collection = db.collection("CrossSection");
    await collection.create({
      schema: {
        rule: CrossSectionIndbAsJsonSchema,
      },
    });
    console.log("CrossSection collection created");
  }

  async function createEdgeCollections() {
    for (const name of Object.values(Relation)) {
		await db.createEdgeCollection(name);
	}
}