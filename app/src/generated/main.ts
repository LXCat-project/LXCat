import fs from "fs/promises";
import { CrossSectionInputAsJsonSchema } from "../ScatteringCrossSection/schema";

async function main() {
    await fs.writeFile(
        'src/generated/input/CrossSection.schema.json',
        JSON.stringify(CrossSectionInputAsJsonSchema, undefined, 4)
    )
}

main()