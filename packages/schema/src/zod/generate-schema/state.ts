// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import zodToJsonSchema from "zod-to-json-schema";
import { State } from "../state";

const schema = zodToJsonSchema(State, { $refStrategy: "none" });

console.log(JSON.stringify(schema, null, 2));
