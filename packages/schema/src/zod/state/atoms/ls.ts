import { z } from "zod";
import {
  atomic_orbital,
  parse_div_two,
  parse_shell_config,
} from "../../../core/parsers/common";
import { atom } from "../generators";
import { buildTerm, ShellEntry, TotalAngularSpecifier } from "./common";

export const LSTermImpl = z.object({
  L: z.number().int().nonnegative(),
  S: z.number().multipleOf(0.5).nonnegative(),
  P: z.union([z.literal(-1), z.literal(1)]),
});
export type LSTermImpl = z.input<typeof LSTermImpl>;

export const LSTerm = LSTermImpl.merge(TotalAngularSpecifier);
export type LSTerm = z.input<typeof LSTerm>;

const LSDescriptorImpl = buildTerm(z.array(ShellEntry), LSTerm);
type LSDescriptorImpl = z.infer<typeof LSDescriptorImpl>;

export const LSDescriptor = LSDescriptorImpl.transform((atom) => ({
  ...atom,
  summary: parse_LS(atom),
  latex: parse_LS_latex(atom),
}));
export type LSDescriptor = z.input<typeof LSDescriptor>;

export const AtomLS = atom("AtomLS", LSDescriptor);
export type AtomLS = z.input<typeof AtomLS>;

export function parse_LS_term_impl(term: LSTermImpl): string {
  return `^${2 * term.S + 1}${atomic_orbital[term.L]}${
    term.P == -1 ? "^o" : ""
  }`;
}

export function parse_LS_term(term: LSTerm): string {
  return `${parse_LS_term_impl(term)}_${parse_div_two(term.J)}`;
}

function parse_LS(e: LSDescriptorImpl): string {
  const config = parse_shell_config(e.config);
  return `${config}${config !== "" ? ":" : ""}${parse_LS_term(e.term)}`;
}

export function parse_LS_term_impl_latex(term: LSTermImpl): string {
  return `{}^{${2 * term.S + 1}}\\mathrm{${atomic_orbital[term.L]}}${
    term.P == -1 ? "^o" : ""
  }`;
}

export function parse_LS_term_latex(term: LSTerm): string {
  return `${parse_LS_term_impl_latex(term)}_{${parse_div_two(term.J)}}`;
}

function parse_LS_latex(e: LSDescriptorImpl): string {
  const config = parse_shell_config(e.config);
  return `${config}${config != "" ? ":" : ""}${parse_LS_term_latex(e.term)}`;
}
