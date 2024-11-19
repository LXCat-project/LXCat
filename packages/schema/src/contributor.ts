// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { number, object, string, TypeOf } from "zod";

export const Contributor = object({
  name: string().min(1),
  description: string(),
  contact: string(),
  howToReference: string(),
  totalSets: number().int().min(1).optional(),
});
export type Contributor = TypeOf<typeof Contributor>;
