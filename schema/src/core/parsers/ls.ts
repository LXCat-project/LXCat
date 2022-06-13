import { ParseAtom } from "../parse";
import { AtomLS } from "../atoms/ls";
import { parse_LS } from "./parse_functions";

export const ls_parser: ParseAtom<AtomLS> = {
  // particle_type: ParticleType.Atom,
  e: parse_LS,
};
