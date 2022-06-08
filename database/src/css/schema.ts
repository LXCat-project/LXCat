import { join } from "path";
import { generateJsonSchemaFromType } from "@lxcat/schema/dist/core/generate_schema";

export const CrossSectionSetIndbAsJsonSchema = generateJsonSchemaFromType(
  join(__dirname, "types", "collections.ts"),
  "CrossSectionSet"
);

