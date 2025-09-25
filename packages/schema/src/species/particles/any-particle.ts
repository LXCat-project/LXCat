// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { globalRegistry, literal, object } from "zod";

export const AnyParticle = object({
  type: literal("AnyParticle"),
  composition: literal("M"),
  charge: literal(0),
});

globalRegistry.add(AnyParticle, { id: "AnyParticle" });
