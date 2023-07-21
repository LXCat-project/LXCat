// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import zodToJsonSchema from "zod-to-json-schema";
import { AnySpecies } from "../state/species";

const schema = zodToJsonSchema(AnySpecies, { $refStrategy: "none" });

console.log(JSON.stringify(schema, null, 2));
