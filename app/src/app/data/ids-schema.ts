// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LXCatID } from "@/shared/lxcatid";
import { z } from "zod";
import { BAG_SIZE, PLOT_SIZE } from "../../cs/constants";

const idsSchema = (max: number) =>
  z
    .array(LXCatID)
    .min(1)
    .max(max)
    .refine((e) => new Set(e).size === e.length, {
      message: "Array should have unique elements",
    });

/** The ids that the API accepts. */
export const IdsSchema = idsSchema(BAG_SIZE);

/** The ids that the plot and compute pages accept. */
export const PlotIdsSchema = idsSchema(PLOT_SIZE);
