import { ParseAtom } from "../parse";
import { AtomJ1L2 } from "../atoms/j1l2";
import { parse_J1L2 } from "./parse_functions";

export const j1l2_parser: ParseAtom<AtomJ1L2> = {
  // particle_type: ParticleType.Atom,
  e: parse_J1L2,
};
