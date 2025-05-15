// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import z from "zod";
import { AnySpecies } from "../species/any-species.js";

export const stateJSONSchema = z.toJSONSchema(AnySpecies);
