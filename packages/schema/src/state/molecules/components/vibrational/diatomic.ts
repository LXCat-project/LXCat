// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";

export const DiatomicVibrational = z.object({ v: z.number().int() })
  .transform((value) => ({
    ...value,
    summary: () => value.v.toString(),
    latex: () => value.v.toString(),
  }));
