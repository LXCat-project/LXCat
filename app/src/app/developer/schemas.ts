// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from "zod";

/** An optional name to tell tokens apart, empty names are dropped. */
export const tokenNameSchema = z
  .string()
  .trim()
  .max(100)
  .transform((name) => name || undefined);

export const tokenIdSchema = z.string().min(1);
