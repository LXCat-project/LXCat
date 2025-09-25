// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { literal, object } from "zod";
import { registerType } from "../../common/util.js";

export const AnyParticle = object({
  type: literal("AnyParticle"),
  composition: literal("M"),
  charge: literal(0),
});

registerType(AnyParticle, { id: "AnyParticle" });
