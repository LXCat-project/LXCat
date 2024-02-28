// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { object, string } from "zod";

export const Contributor = object({
  name: string().min(1),
  description: string(),
  contact: string(),
  howToReference: string(),
});
