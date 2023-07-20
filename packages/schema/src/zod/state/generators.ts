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
                        rotational,
                        z.array(rotational),
                        z.string(),
                      ]),
                    ),
                  }),
                ),
                z.array(vibrational),
                z.string(),
              ]),
            ),
          }),
        ),
        z.array(electronic),
      ]),
    }),
  );

export const atom = <Tag extends string, Electronic extends z.ZodTypeAny>(
  tag: Tag,
  electronic: Electronic,
) =>
  typeTag(tag).merge(
    z.object({ electronic: z.union([electronic, z.array(electronic)]) }),
  );
