import { join } from "path";
import { generateJsonSchemaFromType } from "../shared/schema";

export const CrossSectionIndbAsJsonSchema = generateJsonSchemaFromType(
  join(__dirname, "types", "collections.ts"),
  "CrossSection"
);

// TODO do edge collections need schemas?
export enum Relation {
  IsPartOf = "IsPartOf", // Between a cs and its set
  References = "References", // Between a data object and its references
}
