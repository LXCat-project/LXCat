// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { parseCharge, parseChargeLatex } from "../common.js";
import {
  parseComposition,
  parseCompositionLatex,
} from "../composition/universal.js";
import { StateSummary } from "../summary.js";
import { type Unspecified } from "./unspecified.js";

export const serializeUnspecified = (state: Unspecified): StateSummary => {
  const compositionSummary = parseComposition(state.composition);
  const compositionLatex = parseCompositionLatex(state.composition);

  const serialized: StateSummary = {
    particle: compositionLatex,
    charge: state.charge,
    summary: `${compositionSummary}${parseCharge(state.charge)}`,
    latex: `${compositionLatex}${parseChargeLatex(state.charge)}`,
  };
  const latex = `\\mathrm{${state.electronic}}`;

  serialized.summary += "{";
  serialized.latex += "\\left(";

  serialized.electronic = { summary: state.electronic, latex };

  serialized.summary += state.electronic;
  serialized.latex += latex;

  serialized.summary += "}";
  serialized.latex += "\\right)";

  return serialized;
};
