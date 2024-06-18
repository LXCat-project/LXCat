// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { compositionSummary } from "../composition/universal.js";
import { StateSummary } from "../summary.js";
import { AnyAtomSerializable } from "./any-atom.js";

export const serializeAtom = (atom: AnyAtomSerializable): StateSummary => {
  const composition = compositionSummary(atom.composition, atom.charge);

  const serialized: StateSummary = {
    composition,
    ...composition,
  };

  if ("electronic" in atom) {
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
  }

  return serialized;
};
