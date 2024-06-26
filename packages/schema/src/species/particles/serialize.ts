// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { parseCharge, parseChargeLatex } from "../common.js";
import { StateSummary } from "../summary.js";
import { Particle } from "./particle.js";

export const serializeSimpleParticle = (
  state: Particle,
): StateSummary => {
  const composition = {
    summary: `${state.composition}${parseCharge(state.charge)}`,
    latex: `\\mathrm{${state.composition}}${parseChargeLatex(state.charge)}`,
  };
  return ({
    composition,
    ...composition,
  });
};
