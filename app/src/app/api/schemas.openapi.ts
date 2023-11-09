import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { SerializedSpecies } from "@lxcat/database/dist/schema/species";
import { z } from "zod";
import { registry } from "../../docs/openapi";

extendZodWithOpenApi(z);

export const speciesSchema = z.object({
  _id: z.string(),
  species: SerializedSpecies,
  hasChildren: z.boolean(),
});

export default async function() {
  registry().register(
    "Species",
    speciesSchema,
  );
}
