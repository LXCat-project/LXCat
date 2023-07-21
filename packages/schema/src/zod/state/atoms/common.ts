// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";

export const TotalAngularSpecifier = z.object({
  J: z.number().multipleOf(0.5).nonnegative(),
});

export const buildTerm = <
  EConfig extends z.ZodTypeAny,
  Term extends z.ZodTypeAny,
>(electronConfig: EConfig, term: Term) =>
  z.object({ config: electronConfig, term });

export const buildTwoTerm = <
  Core extends z.ZodTypeAny,
  Excited extends z.ZodTypeAny,
>(core: Core, excited: Excited) => z.object({ core, excited });

export const ShellEntry = z.object({
  n: z.number().int().min(1),
  l: z.number().int().nonnegative(),
  occupance: z.number().int().nonnegative(),
});
