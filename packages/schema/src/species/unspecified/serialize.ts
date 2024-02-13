// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { serializeSimpleParticle } from "../composition/simple/serialize.js";
import { StateSummary } from "../summary.js";
import { type Unspecified } from "./unspecified.js";

export const serializeUnspecified = (state: Unspecified): StateSummary => {
  const serialized = serializeSimpleParticle(state);
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
