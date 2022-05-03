import { ParseMolecule } from "../parse";
import { LinearTriatomInversionCenter } from "../types/molecules/triatom_linear_inversion_center";
import { parse_e_lice, parse_r_mr, parse_v_ltv } from "./parse_functions";

export const ltic_parser: ParseMolecule<LinearTriatomInversionCenter> = {
  // particle_type: ParticleType.Molecule,
  e: parse_e_lice,
  v: parse_v_ltv,
  r: parse_r_mr,
};
