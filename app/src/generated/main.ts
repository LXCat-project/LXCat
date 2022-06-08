import fs from "fs/promises";
import { CrossSectionSetInputAsJsonSchema } from "../ScatteringCrossSectionSet/schema";

async function main() {
  await fs.writeFile(
    "src/generated/input/CrossSectionSet.schema.json",
    JSON.stringify(CrossSectionSetInputAsJsonSchema, undefined, 4)
  );
}

main();
