// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { AtomLS, AtomLSImpl, LSTerm, LSTermImpl } from "../atoms/ls";
import { AtomParser } from "../parse";
import {
  atomic_orbital,
  parse_div_two,
  parse_shell_config,
  PUA,
} from "./common";

export function parse_LS_term_impl(term: LSTermImpl): string {
  return `^${2 * term.S + 1}${atomic_orbital[term.L]}${
    term.P == -1 ? "^o" : ""
  }`;
}

export function parse_LS_term(term: LSTerm): string {
  return `${parse_LS_term_impl(term)}_${parse_div_two(term.J)}`;
}

function parse_LS(e: PUA<AtomLSImpl>): string {
  if (e.term === undefined) {
    return e.e;
  }

  const config = parse_shell_config(e.config);
  return `${config}${config != "" ? ":" : ""}${parse_LS_term(e.term)}`;
}

export function parse_LS_term_impl_latex(term: LSTermImpl): string {
  return `{}^{${2 * term.S + 1}}\\mathrm{${atomic_orbital[term.L]}}${
    term.P == -1 ? "^o" : ""
  }`;
}

export function parse_LS_term_latex(term: LSTerm): string {
  return `${parse_LS_term_impl_latex(term)}_{${parse_div_two(term.J)}}`;
}

function parse_LS_latex(e: PUA<AtomLSImpl>): string {
  if (e.term === undefined) {
    return e.e;
  }

  const config = parse_shell_config(e.config);
  return `${config}${config != "" ? ":" : ""}${parse_LS_term_latex(e.term)}`;
}

export const ls_parser: AtomParser<AtomLS> = {
  // particle_type: ParticleType.Atom,
  id: parse_LS,
  latex: parse_LS_latex,
};
