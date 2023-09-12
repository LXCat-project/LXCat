// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import zodToJsonSchema from "zod-to-json-schema";
import { State } from "../state";

export const stateJSONSchema = zodToJsonSchema(State, { $refStrategy: "none" });
