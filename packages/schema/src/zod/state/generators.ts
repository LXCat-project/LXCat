// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";

export const typeTag = <Tag extends string>(tag: Tag) =>
  z.object({ type: z.literal(tag) });

export const molecule = <
  Tag extends string,
  Electronic extends z.ZodTypeAny,
  Vibrational extends z.ZodTypeAny,
  Rotational extends z.ZodTypeAny,
>(
  tag: Tag,
  electronic: Electronic,
  vibrational: Vibrational,
  rotational: Rotational,
) =>
  typeTag(tag).merge(
    z.object({
      electronic: z.union([
        z.intersection(
          electronic,
          z.object({
            vibrational: z.optional(
              z.union([
                z.intersection(
                  vibrational,
                  z.object({
                    rotational: z.optional(
                      z.union([
                        rotational.describe("Singular"),
                        z.array(z.union([rotational, z.string()]))
                          .describe("Compound"),
                        z.string().describe("Unspecified"),
                      ]),
                    ),
                  }),
                ).describe("Singular"),
                z.array(z.union([vibrational, z.string()]))
                  .describe("Compound"),
                z.string().describe("Unspecified"),
              ]),
            ),
          }),
        ).describe("Singular"),
        z.array(electronic).describe("Compound"),
      ]),
    }),
  );

export const atom = <Tag extends string, Electronic extends z.ZodTypeAny>(
  tag: Tag,
  electronic: Electronic,
) =>
  typeTag(tag).merge(
    z.object({
      electronic: z.union([
        electronic.describe("Singular"),
        z.array(electronic).describe("Compound"),
      ]),
    }),
  );
