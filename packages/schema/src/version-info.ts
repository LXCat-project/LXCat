// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { coerce, number, object } from "zod";

export const VersionInfo = object({
  version: number().int().positive(),
  createdOn: coerce.date(),
});
