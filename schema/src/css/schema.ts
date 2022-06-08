import {join} from "path";
import { generateJsonSchemaFromType } from "../core/generate_schema";

const typesPath = join(__dirname, "./input.ts");

export const CrossSectionSetInputAsJsonSchema = generateJsonSchemaFromType(
  typesPath,
  "CrossSectionSetInput"
);
