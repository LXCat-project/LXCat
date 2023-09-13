// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { AnyAtom } from "./atoms";
import { parseCharge, parseChargeLatex } from "./common";
import { AnyMolecule } from "./molecules";
import { SimpleParticle } from "./particle";
import { AnySpecies } from "./species";
import { type StateSummary } from "./summary";

// TODO: It might be beneficial to move this transform to the separate
//       constituents of State (e.g. simple, AnyAtom, AnyMolecule, etc.).
//       Although this would require moving SimpleParticle to the separate
//       definitions, e.g. the `atom` and `molecule` functions.
export const State = z.intersection(SimpleParticle, AnySpecies).transform(
  (state) => ({
    ...state,
    serialize: (): StateSummary => {
      const serialized: StateSummary = {
        particle: state.particle,
        charge: state.charge,
        summary: `${state.particle}${parseCharge(state.charge)}`,
        latex: `\\mathrm{${state.particle}}${parseChargeLatex(state.charge)}`,
      };

      if (state.type === "unspecified") {
        serialized.summary += "{";
        serialized.latex += "\\left(";

        serialized.electronic = {
          summary: state.electronic,
          latex: state.electronic,
        };

        serialized.summary += state.electronic;
        serialized.latex += state.electronic;

        serialized.summary += "}";
        serialized.latex += "\\right)";
      } else if (isAtom(state)) {
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
        }

        serialized.summary += "}";
        serialized.latex += "\\right)";
      } else if (isMolecule(state)) {
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
      }

      return serialized;
    },
  }),
);
export type State = z.input<typeof State>;
export type SerializableState = z.output<typeof State>;

export const isAtom = (
  state: SimpleParticle & AnySpecies,
): state is SimpleParticle & AnyAtom =>
  AnyAtom.options.some((option) => option.shape.type.value === state.type);

export const isMolecule = (
  state: SimpleParticle & AnySpecies,
): state is SimpleParticle & AnyMolecule =>
  AnyMolecule.options.some((option) => option.shape.type.value === state.type);
