import { ParseMolecule } from "../parse";
import { HomonuclearDiatom } from "../molecules/diatom_homonuclear";
import { parse_e_lice, parse_r_mr, parse_v_hdv } from "./parse_functions";

export const hd_parser: ParseMolecule<HomonuclearDiatom> = {
  // particle_type: ParticleType.Molecule,
  e: parse_e_lice,
  v: parse_v_hdv,
  r: parse_r_mr,
};
