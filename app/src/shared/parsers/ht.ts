import { ParseMolecule } from "../parse";
import { HeteronuclearDiatom } from "../types/molecules/diatom_heteronuclear";
import { parse_e_me, parse_r_mr, parse_v_hdv } from "./parse_functions";

export const ht_parser: ParseMolecule<HeteronuclearDiatom> = {
  // particle_type: ParticleType.Molecule,
  e: parse_e_me,
  v: parse_v_hdv,
  r: parse_r_mr,
};
