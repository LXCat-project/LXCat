// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { CSLData } from "./csl/data";

export const Reference = CSLData;
export type Reference = z.infer<typeof Reference>;
