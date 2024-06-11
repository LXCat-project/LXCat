// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { compositionSummary } from "../composition/universal.js";
import { StateSummary } from "../summary.js";
import { type Unspecified } from "./unspecified.js";

export const serializeUnspecified = (state: Unspecified): StateSummary => {
  const composition = compositionSummary(state.composition, state.charge);

  const serialized: StateSummary = {
    composition,
    ...composition,
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
