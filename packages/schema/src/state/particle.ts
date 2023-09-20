// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { typeTag } from "./generators";

export const SimpleParticle = z.object({
  particle: z.string().min(1),
  charge: z.number().int(),
});
export type SimpleParticle = z.infer<typeof SimpleParticle>;

export const AnyParticle = typeTag("simple").merge(SimpleParticle);
export type AnyParticle = z.infer<typeof AnyParticle>;
