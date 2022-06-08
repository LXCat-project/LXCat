import { join } from "path";
import { generateJsonSchemaFromType } from "@lxcat/schema/dist/core/generate_schema";

export const CrossSectionIndbAsJsonSchema = generateJsonSchemaFromType(
  join(__dirname, "collections.ts"),
  "CrossSection"
);

// TODO do edge collections need schemas?
export enum Relation {
  IsPartOf = "IsPartOf", // Between a cs and its set
  References = "References", // Between a data object and its references
}
