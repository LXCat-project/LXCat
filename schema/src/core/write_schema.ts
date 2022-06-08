import fs from "fs/promises";
import { CrossSectionSetInputAsJsonSchema } from "../css/schema";

async function main() {
  await fs.mkdir("dist/schemas", { recursive: true });
  await fs.writeFile(
    "dist/schemas/CrossSectionSet.schema.json",
    JSON.stringify(CrossSectionSetInputAsJsonSchema, undefined, 4)
  );
}

main();
