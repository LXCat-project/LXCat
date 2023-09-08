// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { atom } from "../generators";
import {
  buildTerm,
  buildTwoTerm,
  serializeHalfInteger,
  serializeShellConfig,
  ShellEntry,
  TotalAngularSpecifier,
} from "./common";
import {
  LSDescriptor,
  LSTermImpl,
  serializeLatexLSTerm,
  serializeLatexLSTermImpl,
  serializeLSTerm,
  serializeLSTermImpl,
} from "./ls";

export const J1L2Term = z.object({
  K: z.number().multipleOf(0.5).nonnegative(),
  S: z.number().multipleOf(0.5).nonnegative(),
  P: z.union([z.literal(-1), z.literal(1)]),
}).merge(TotalAngularSpecifier);
export type J1L2Term = z.infer<typeof J1L2Term>;

const J1L2DescriptorImpl = buildTerm(
  buildTwoTerm(LSDescriptor, buildTerm(z.array(ShellEntry), LSTermImpl)),
  J1L2Term,
);
type J1L2DescriptorImpl = z.infer<typeof J1L2DescriptorImpl>;

export const J1L2Descriptor = J1L2DescriptorImpl
  .transform((atom) => ({
    ...atom,
    summary: () => serializeJ1L2(atom),
    latex: () => serializeLatexJ1L2(atom),
  }));

export const AtomJ1L2 = atom("AtomJ1L2", J1L2Descriptor);
export type AtomJ1L2 = z.input<typeof AtomJ1L2>;

// ID parsing functions
function serializeJ1L2Term(term: J1L2Term): string {
  return `${2 * term.S + 1}[${serializeHalfInteger(term.K)}]${
    term.P == -1 ? "^o" : ""
  }_${serializeHalfInteger(term.J)}`;
}

const serializeJ1L2 = (e: J1L2DescriptorImpl): string => {
  return (
    serializeShellConfig(e.config.core.config)
    + "{"
    + serializeLSTerm(e.config.core.term)
    + "}"
    + serializeShellConfig(e.config.excited.config)
    + "{"
    + serializeLSTermImpl(e.config.excited.term)
    + "}"
    + serializeJ1L2Term(e.term)
  );
};

// LaTeX parsing functions
const serializeLatexJ1L2Term = (term: J1L2Term): string => {
  return `{}^{${2 * term.S + 1}}[${serializeHalfInteger(term.K)}]${
    term.P == -1 ? "^o" : ""
  }_{${serializeHalfInteger(term.J)}}`;
};

const serializeLatexJ1L2 = (e: J1L2DescriptorImpl): string => {
  return (
    serializeShellConfig(e.config.core.config)
    + "("
    + serializeLatexLSTerm(e.config.core.term)
    + ")"
    + serializeShellConfig(e.config.excited.config)
    + "("
    + serializeLatexLSTermImpl(e.config.excited.term)
    + ")"
    + serializeLatexJ1L2Term(e.term)
  );
};
