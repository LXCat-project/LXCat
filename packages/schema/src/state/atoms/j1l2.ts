// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { makeComponent } from "../component";
import { makeAtom } from "../generators";
import { SimpleParticle } from "../particle";
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
  LSTermUncoupled,
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

const J1L2Descriptor = buildTerm(
  buildTwoTerm(LSDescriptor, buildTerm(z.array(ShellEntry), LSTermUncoupled)),
  J1L2Term,
);
type J1L2Descriptor = z.infer<typeof J1L2Descriptor>;

// Summary serializer functions
function serializeJ1L2Term(term: J1L2Term): string {
  return `${2 * term.S + 1}[${serializeHalfInteger(term.K)}]${
    term.P == -1 ? "^o" : ""
  }_${serializeHalfInteger(term.J)}`;
}

const serializeJ1L2 = (e: J1L2Descriptor): string => {
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

// LaTeX serializer functions
const serializeLatexJ1L2Term = (term: J1L2Term): string => {
  return `{}^{${2 * term.S + 1}}[${serializeHalfInteger(term.K)}]${
    term.P == -1 ? "^o" : ""
  }_{${serializeHalfInteger(term.J)}}`;
};

const serializeLatexJ1L2 = (e: J1L2Descriptor): string => {
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

export const J1L2Component = makeComponent(
  J1L2Descriptor,
  serializeJ1L2,
  serializeLatexJ1L2,
);

export const AtomJ1L2 = makeAtom("AtomJ1L2", SimpleParticle, J1L2Component);
export type AtomJ1L2 = z.output<typeof AtomJ1L2.plain>;
