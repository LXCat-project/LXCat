// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { object, string } from "zod";

export const querySchema = object({
  query: object({
    contributor: string().min(1).optional(),
  }),
});
