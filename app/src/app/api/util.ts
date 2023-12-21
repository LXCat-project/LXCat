// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from "zod";

export type MaybePromise<T> = T | Promise<T>;

export const queryArraySchema = <
  Schema extends
    | z.ZodArray<z.ZodString>
    | z.ZodEffects<z.ZodArray<z.ZodString>>,
>(
  schema: Schema,
) =>
  z.preprocess((a) => {
    if (typeof a === "string") {
      return a.split(",");
    }
  }, schema).describe("Comma seperated string array.");

export const queryJSONSchema = <Schema extends z.ZodTypeAny>(
  schema: Schema,
) =>
  z.preprocess((o) => {
    if (typeof o === "string") {
      try {
        return JSON.parse(o);
      } catch {}
    }
  }, schema).describe("URL encoded JSON object");
