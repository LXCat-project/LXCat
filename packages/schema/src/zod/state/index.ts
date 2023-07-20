// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { AnyAtom } from "./atoms";
import { AnyMolecule } from "./molecules";
import { SimpleParticle } from "./particle";
import { AnySpecies } from "./species";

// TODO: It might be beneficial to move this transform to the separate
//       constituents of State (e.g. simple, AnyAtom, AnyMolecule, etc.).
//       Although this would require moving SimpleParticle to the separate
//       definitions, e.g. the `atom` and `molecule` functions.
export const State = z.intersection(SimpleParticle, AnySpecies).transform(
  (state) => {
    let summary = `${state.particle}^{${state.charge}}`;
    let latex = summary;

    if (state.type === "unspecified") {
      summary += "{";
      latex += "\\left(";

      summary += state.electronic;
      latex += state.electronic;

      summary += "}";
      latex += "\\right)";
    } else if (isAtom(state)) {
      const electronic = state.electronic;

      summary += "{";
      latex += "\\left(";

      if (Array.isArray(electronic)) {
        summary += electronic.map(({ summary }) => summary).join("|");
        latex += electronic.map(({ latex }) => latex).join("|");
      } else {
        summary += electronic.summary;
        latex += electronic.latex;
      }

      summary += "}";
      latex += "\\right)";
    } else if (isMolecule(state)) {
      const electronic = state.electronic;

      summary += "{";
      latex += "\\left(";

      if (Array.isArray(electronic)) {
        summary += electronic.map(({ summary }) => summary).join("|");
        latex += electronic.map(({ latex }) => latex).join("|");
      } else {
        summary += electronic.summary;
        latex += electronic.latex;

        if (electronic.vibrational) {
          const vibrational = electronic.vibrational;

          summary += "{";
          latex += "\\left(";

          if (typeof vibrational === "string") {
            summary += vibrational;
            latex += vibrational;
          } else if (Array.isArray(vibrational)) {
            summary += vibrational.map(({ summary }) => summary).join("|");
            latex += vibrational.map(({ latex }) => latex).join("|");
          } else {
            summary += vibrational.summary;
            latex += vibrational.latex;

            if (vibrational.rotational) {
              const rotational = vibrational.rotational;

              summary += "{";
              latex += "\\left(";

              if (typeof rotational === "string") {
                summary += rotational;
                latex += rotational;
              } else if (Array.isArray(rotational)) {
                summary += rotational.map(({ summary }) => summary).join("|");
                latex += rotational.map(({ latex }) => latex).join("|");
              } else {
                summary += rotational.summary;
                latex += rotational.latex;
              }

              summary += "}";
              latex += "\\right)";
            }
          }

          summary += "}";
          latex += "\\right)";
        }
      }

      summary += "}";
      latex += "\\right)";
    }
    return { ...state, summary, latex };
  },
);
export type State = z.input<typeof State>;

export const isAtom = (
  state: SimpleParticle & AnySpecies,
): state is SimpleParticle & AnyAtom =>
  AnyAtom.options.some((option) => option.shape.type.value === state.type);

export const isMolecule = (
  state: SimpleParticle & AnySpecies,
): state is SimpleParticle & AnyMolecule =>
  AnyMolecule.options.some((option) => option.shape.type.value === state.type);
