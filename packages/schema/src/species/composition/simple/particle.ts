// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { number, object, output, string } from "zod";

export const SimpleParticle = object({
  composition: string().min(1),
  charge: number().int(),
});
export type SimpleParticle = output<typeof SimpleParticle>;
