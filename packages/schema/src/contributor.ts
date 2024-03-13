// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { object, string, TypeOf } from "zod";

export const Contributor = object({
  name: string().min(1),
  description: string(),
  contact: string(),
  howToReference: string(),
});
export type Contributor = TypeOf<typeof Contributor>;
