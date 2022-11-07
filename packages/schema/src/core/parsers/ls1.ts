// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: Apache-2.0

import { AtomParser } from "../parse";
import { AtomLS1, AtomLS1Impl, LS1Term } from "../atoms/ls1";
import {
  atomic_orbital,
  parse_div_two,
  parse_shell_config,
  PUA,
} from "./common";
import { parse_LS_term_impl, parse_LS_term_impl_latex } from "./ls";

function parse_LS1_term(term: LS1Term): string {
  return `${atomic_orbital[term.L]}^${2 * term.S + 1}[${parse_div_two(
    term.K
  )}]${term.P == -1 ? "^o" : ""}_${parse_div_two(term.J)}`;
}

export function parse_LS1(e: PUA<AtomLS1Impl>): string {
  if (e.term === undefined) {
    return e.e;
  }

  return (
    parse_shell_config(e.config.core.config) +
    "{" +
    parse_LS_term_impl(e.config.core.term) +
    "}" +
    parse_shell_config(e.config.excited.config) +
    "{" +
    parse_LS_term_impl(e.config.excited.term) +
    "}" +
    parse_LS1_term(e.term)
  );
}

function parse_LS1_term_latex(term: LS1Term): string {
  return `\\mathrm{${atomic_orbital[term.L]}}^{${
    2 * term.S + 1
  }}[${parse_div_two(term.K)}]${term.P == -1 ? "^o" : ""}_{${parse_div_two(
    term.J
  )}}`;
}

export function parse_LS1_latex(e: PUA<AtomLS1Impl>): string {
  if (e.term === undefined) {
    return e.e;
  }

  return (
    parse_shell_config(e.config.core.config) +
    "(" +
    parse_LS_term_impl_latex(e.config.core.term) +
    ")" +
    parse_shell_config(e.config.excited.config) +
    "(" +
    parse_LS_term_impl_latex(e.config.excited.term) +
    ")" +
    parse_LS1_term_latex(e.term)
  );
}

export const ls1_parser: AtomParser<AtomLS1> = {
  // particle_type: ParticleType.Atom,
  id: parse_LS1,
  latex: parse_LS1_latex,
};
