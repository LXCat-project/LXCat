import { join } from "path";
import { generateJsonSchemaFromType } from "../shared/schema";

export const CrossSectionIndbAsJsonSchema = generateJsonSchemaFromType(
  join(__dirname, "types", "collections.ts"),
  "CrossSection"
);

// TODO do edge collections need schemas?
export enum Relation {
  HasCS = "HasCS", // Between a reaction and its cs
  IsPartOf = "IsPartOf", // Between a cs and its set
  References = "References", // Between a data object and its references
  Provides = "Provides", // Between a contributor and its data entries
}
