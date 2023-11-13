// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { parseCharge, parseChargeLatex } from "../common";
import { StateSummary } from "../summary";
import { AnyAtomSerializable } from "./any-atom";

export const serializeAtom = (atom: AnyAtomSerializable): StateSummary => {
  const serialized: StateSummary = {
    particle: atom.particle,
    charge: atom.charge,
    summary: `${atom.particle}${parseCharge(atom.charge)}`,
    latex: `\\mathrm{${atom.particle}}${parseChargeLatex(atom.charge)}`,
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
