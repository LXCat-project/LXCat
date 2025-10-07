// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LXCatID } from "@/shared/lxcatid";
import { z } from "zod";
import { BAG_SIZE } from "../../cs/constants";

export const IdsSchema = z
  .array(LXCatID)
  .min(1)
  .max(BAG_SIZE)
  .refine((e) => new Set(e).size === e.length, {
    message: "Array should have unique elements",
  });
