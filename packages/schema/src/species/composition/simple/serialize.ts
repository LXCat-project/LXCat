// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { parseCharge, parseChargeLatex } from "../../common.js";
import { StateSummary } from "../../summary.js";
import { SimpleParticle } from "./particle.js";

export const serializeSimpleParticle = (
  state: SimpleParticle,
): StateSummary => ({
  particle: state.particle,
  charge: state.charge,
  summary: `${state.particle}${parseCharge(state.charge)}`,
  latex: `\\mathrm{${state.particle}}${parseChargeLatex(state.charge)}`,
});
