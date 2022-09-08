import { ParseAtom } from "../parse";
import { AtomJ1L2, AtomJ1L2Impl, J1L2Term } from "../atoms/j1l2";
import { parse_div_two, parse_shell_config, PUA } from "./common";
import { parse_LS_term, parse_LS_term_impl, parse_LS_term_impl_latex, parse_LS_term_latex } from "./ls";

// ID parsing functions
function parse_J1L2_term(term: J1L2Term): string {
  return `${2 * term.S + 1}[${parse_div_two(term.K)}]${
    term.P == -1 ? "^o" : ""
  }_${parse_div_two(term.J)}`;
}

export function parse_J1L2(e: PUA<AtomJ1L2Impl>): string {
  if (e.term === undefined) {
    return e.e;
  }

  return (
    parse_shell_config(e.config.core.config) +
    "{" +
    parse_LS_term(e.config.core.term) +
    "}" +
    parse_shell_config(e.config.excited.config) +
    "{" +
    parse_LS_term_impl(e.config.excited.term) +
    "}" +
    parse_J1L2_term(e.term)
  );
}

// LaTeX parsing functions
function parse_J1L2_term_latex(term: J1L2Term): string {
  return `{}^{${2 * term.S + 1}}[${parse_div_two(term.K)}]${
    term.P == -1 ? "^o" : ""
  }_{${parse_div_two(term.J)}}`;
}

export function parse_J1L2_latex(e: PUA<AtomJ1L2Impl>): string {
  if (e.term === undefined) {
    return e.e;
  }

  return (
    parse_shell_config(e.config.core.config) +
    "(" +
    parse_LS_term_latex(e.config.core.term) +
    ")" +
    parse_shell_config(e.config.excited.config) +
    "(" +
    parse_LS_term_impl_latex(e.config.excited.term) +
    ")" +
    parse_J1L2_term_latex(e.term)
  );
}

export const j1l2_parser: ParseAtom<AtomJ1L2> = {
  // particle_type: ParticleType.Atom,
  id: parse_J1L2,
  latex: parse_J1L2_latex,
};
