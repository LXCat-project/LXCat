import { ParseAtom } from "../parse";
import { AtomLS1 } from "../types/atoms/ls1";
import { parse_LS1 } from "./parse_functions";

export const ls1_parser: ParseAtom<AtomLS1> = {
  // particle_type: ParticleType.Atom,
  e: parse_LS1,
};
