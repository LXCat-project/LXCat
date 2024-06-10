// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { parseCharge, parseChargeLatex } from "../common.js";
import {
  parseComposition,
  parseCompositionLatex,
} from "../composition/universal.js";
import { StateSummary } from "../summary.js";
import { AnyMoleculeSerializable } from "./any-molecule.js";

export const serializeMolecule = (
  state: AnyMoleculeSerializable,
): StateSummary => {
  const compositionSummary = parseComposition(state.composition);
  const compositionLatex = parseCompositionLatex(state.composition);

  const serialized: StateSummary = {
    particle: compositionLatex,
    charge: state.charge,
    summary: `${compositionSummary}${parseCharge(state.charge)}`,
    latex: `${compositionLatex}${parseChargeLatex(state.charge)}`,
  };

  const electronic = state.electronic;

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

    if (electronic.vibrational) {
      const vibrational = electronic.vibrational;

      serialized.summary += "{";
      serialized.latex += "\\left(";

      if (typeof vibrational === "string") {
        serialized.electronic.vibrational = {
          summary: vibrational,
          latex: vibrational,
        };
        serialized.summary += vibrational;
        serialized.latex += vibrational;
      } else if (Array.isArray(vibrational)) {
        serialized.electronic.vibrational = vibrational.map((vib) =>
          typeof vib === "string" ? { summary: vib, latex: vib } : {
            summary: vib.summary(),
            latex: vib.latex(),
          }
        );
        serialized.summary += serialized.electronic.vibrational
          .map(({ summary }) => summary).join("|");
        serialized.latex += serialized.electronic.vibrational
          .map(({ latex }) => latex).join("|");
      } else {
        serialized.electronic.vibrational = {
          summary: vibrational.summary(),
          latex: vibrational.latex(),
        };

        serialized.summary += serialized.electronic.vibrational.summary;
        serialized.latex += serialized.electronic.vibrational.latex;

        if (vibrational.rotational) {
          const rotational = vibrational.rotational;

          serialized.summary += "{";
          serialized.latex += "\\left(";

          if (typeof rotational === "string") {
            serialized.electronic.vibrational.rotational = {
              summary: rotational,
              latex: rotational,
            };
            serialized.summary += rotational;
            serialized.latex += rotational;
          } else if (Array.isArray(rotational)) {
            serialized.electronic.vibrational.rotational = rotational.map(
              (rot) =>
                typeof rot === "string" ? { summary: rot, latex: rot } : {
                  summary: rot.summary(),
                  latex: rot.latex(),
                },
            );
            serialized.summary += serialized
              .electronic
              .vibrational
              .rotational
              .map(({ summary }) => summary).join("|");
            serialized.latex += serialized
              .electronic
              .vibrational
              .rotational
              .map(({ latex }) => latex).join("|");
          } else {
            serialized.electronic.vibrational.rotational = {
              summary: rotational.summary(),
              latex: rotational.latex(),
            };
            serialized.summary +=
              serialized.electronic.vibrational.rotational.summary;
            serialized.latex +=
              serialized.electronic.vibrational.rotational.latex;
          }

          serialized.summary += "}";
          serialized.latex += "\\right)";
        }
      }

      serialized.summary += "}";
      serialized.latex += "\\right)";
    }
  }

  serialized.summary += "}";
  serialized.latex += "\\right)";

  return serialized;
};
