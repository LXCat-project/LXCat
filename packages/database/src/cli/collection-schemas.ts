import { State } from "@lxcat/schema/dist/state";
import path from "path";
import { z } from "zod";
import { generateSchema } from "../shared/generate-schema";

const Contributor = z.object({ name: z.string() });

generateSchema(
  Contributor,
  path.join(process.cwd(), "src/shared/schemas/Contributor.schema.json"),
);

generateSchema(
  State,
  path.join(process.cwd(), "src/shared/schemas/State.schema.json"),
);
