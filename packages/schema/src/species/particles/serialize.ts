// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { SimpleParticle } from "../composition/simple/particle.js";
import { serializeSimpleParticle } from "../composition/simple/serialize.js";
import { compositionSummary } from "../composition/universal.js";
import { StateSummary } from "../summary.js";
import { AnyParticle } from "./any-particle.js";

export const serializeAnyParticle = (particle: AnyParticle): StateSummary => {
  if (typeof particle.composition === "string") {
    return serializeSimpleParticle(particle as SimpleParticle);
  }

  const composition = compositionSummary(particle.composition, particle.charge);

  return { composition, ...composition };
};
