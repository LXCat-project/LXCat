import { join } from "path";
import { generateJsonSchemaFromType } from "../shared/schema";

const collectionsPath = join(__dirname, "types", "collections.ts");

export const CrossSectionSetIndbAsJsonSchema = generateJsonSchemaFromType(
  collectionsPath,
  "CrossSectionSet"
);

export const CrossSectionIndbAsJsonSchema = generateJsonSchemaFromType(
  collectionsPath,
  "CrossSection"
);

// TODO do edge collections need schemas?
export enum Relation {
  HasCS = "HasCS", // Between a reaction and its cs
  IsPartOf = "IsPartOf", // Between a cs and its set
  References = "References", // Between a data object and its references
  Provides = "Provides", // Between a contributor and its data entries
}
