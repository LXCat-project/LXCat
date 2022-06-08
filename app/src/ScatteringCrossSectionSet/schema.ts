import { join } from "path";
import { generateJsonSchemaFromType } from "../shared/schema";

export const CrossSectionSetIndbAsJsonSchema = generateJsonSchemaFromType(
  join(__dirname, "types", "collections.ts"),
  "CrossSectionSet"
);

const typesPath = join(__dirname, "types/index.ts");

export const CrossSectionSetInputAsJsonSchema = generateJsonSchemaFromType(
  typesPath,
  "CrossSectionSetInput"
);
