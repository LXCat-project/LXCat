// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AnySpecies } from "@lxcat/schema/species";
import path from "path";
import { object, string } from "zod";
import { generateSchema } from "../shared/generate-schema.js";

const Contributor = object({ name: string() });

generateSchema(
  Contributor,
  path.join(process.cwd(), "src/shared/schemas/Contributor.schema.json"),
);

generateSchema(
  AnySpecies,
  path.join(process.cwd(), "src/shared/schemas/State.schema.json"),
);
