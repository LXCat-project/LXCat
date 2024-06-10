import { parseCharge, parseChargeLatex } from "../common.js";
import {
  parseComposition,
  parseCompositionLatex,
} from "../composition/universal.js";
import { StateSummary } from "../summary.js";
import { AnyParticle } from "./any-particle.js";

export const serializeAnyParticle = (particle: AnyParticle): StateSummary => {
  if (typeof particle.composition === "string") {
    return {
      particle: particle.composition,
      charge: particle.charge,
      summary: `${particle.composition}${parseCharge(particle.charge)}`,
      latex: `\\mathrm{${particle.composition}}${
        parseChargeLatex(particle.charge)
      }`,
    };
  }

  const compositionSummary = parseComposition(particle.composition);
  const compositionLatex = parseCompositionLatex(particle.composition);

  return {
    particle: compositionLatex,
    charge: particle.charge,
    summary: `${compositionSummary}${parseCharge(particle.charge)}`,
    latex: `${compositionLatex}${parseChargeLatex(particle.charge)}`,
  };
};
