// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { zodToJsonSchema } from "zod-to-json-schema";
import { AnySpecies } from "../species/any-species.js";

export const stateJSONSchema = zodToJsonSchema(AnySpecies, {
  $refStrategy: "none",
});
