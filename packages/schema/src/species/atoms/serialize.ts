// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { parseCharge, parseChargeLatex } from "../common.js";
import {
  parseComposition,
  parseCompositionLatex,
} from "../composition/universal.js";
import { StateSummary } from "../summary.js";
import { AnyAtomSerializable } from "./any-atom.js";

export const serializeAtom = (atom: AnyAtomSerializable): StateSummary => {
  const compositionSummary = parseComposition(atom.composition);
  const compositionLatex = parseCompositionLatex(atom.composition);

  const serialized: StateSummary = {
    particle: compositionLatex,
    charge: atom.charge,
    summary: `${compositionSummary}${parseCharge(atom.charge)}`,
    latex: `${compositionLatex}${parseChargeLatex(atom.charge)}`,
  };
  const electronic = atom.electronic;

  serialized.summary += "{";
  serialized.latex += "\\left(";

  if (Array.isArray(electronic)) {
    serialized.electronic = electronic.map(({ summary, latex }) => ({
      summary: summary(),
      latex: latex(),
    }));

    serialized.summary += serialized.electronic
      .map(({ summary }) => summary).join("|");
    serialized.latex += serialized.electronic
      .map(({ latex }) => latex).join("|");
  } else {
    serialized.electronic = {
      summary: electronic.summary(),
      latex: electronic.latex(),
    };
    serialized.summary += serialized.electronic.summary;
    serialized.latex += serialized.electronic.latex;
  }

  serialized.summary += "}";
  serialized.latex += "\\right)";

  return serialized;
};
