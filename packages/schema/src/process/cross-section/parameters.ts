// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { number, object, TypeOf } from "zod";

export const CrossSectionParameters = object({
  massRatio: number().positive().optional(),
  statisticalWeightRatio: number().positive().optional(),
});

export type CrossSectionParameters = TypeOf<typeof CrossSectionParameters>;
