import { parseCharge, parseChargeLatex } from "../../common";
import { StateSummary } from "../../summary";
import { SimpleParticle } from "./particle";

export const serializeSimpleParticle = (
  state: SimpleParticle,
): StateSummary => ({
  particle: state.particle,
  charge: state.charge,
  summary: `${state.particle}${parseCharge(state.charge)}`,
  latex: `\\mathrm{${state.particle}}${parseChargeLatex(state.charge)}`,
});
