// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { SimpleParticle } from "../composition/simple/particle";
import { typeTag } from "../generators";

export const Unspecified = typeTag("unspecified")
  .merge(SimpleParticle)
  .merge(z.object({ electronic: z.string().min(1) }));
export type Unspecified = z.infer<typeof Unspecified>;
