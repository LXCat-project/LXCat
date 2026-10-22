// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from "zod";

export type MaybePromise<T> = T | Promise<T>;

export const queryArraySchema = <
  Schema extends z.ZodType<string[] | undefined>,
>(
  schema: Schema,
) =>
  z.preprocess((a) => typeof a === "string" ? a.split(",") : undefined, schema)
    .describe("Comma separated string array.");
