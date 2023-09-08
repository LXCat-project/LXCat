// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { atom } from "../generators";
import {
  atomicOrbital,
  buildTerm,
  buildTwoTerm,
  serializeHalfInteger,
  serializeShellConfig,
  ShellEntry,
  TotalAngularSpecifier,
} from "./common";
import {
  LSTermImpl,
  serializeLatexLSTermImpl,
  serializeLSTermImpl,
} from "./ls";

export const LS1Term = z.object({
  L: z.number().int().nonnegative(),
  K: z.number().multipleOf(0.5).nonnegative(),
  S: z.number().multipleOf(0.5).nonnegative(),
  P: z.union([z.literal(-1), z.literal(1)]),
}).merge(TotalAngularSpecifier);
export type LS1Term = z.infer<typeof LS1Term>;

export const LS1DescriptorImpl = buildTerm(
  buildTwoTerm(
    buildTerm(z.array(ShellEntry), LSTermImpl),
    buildTerm(z.array(ShellEntry), LSTermImpl),
  ),
  LS1Term,
);
type LS1DescriptorImpl = z.infer<typeof LS1DescriptorImpl>;

export const LS1Descriptor = LS1DescriptorImpl.transform((atom) => ({
  ...atom,
  summary: () => serializeLS1(atom),
  latex: () => serializeLatexLS1,
}));

export const AtomLS1 = atom("AtomLS1", LS1Descriptor);
export type AtomLS1 = z.input<typeof AtomLS1>;

/// Serializer functions

function serializeLS1Term(term: LS1Term): string {
  return `${atomicOrbital[term.L]}^${2 * term.S + 1}[${
    serializeHalfInteger(
      term.K,
    )
  }]${term.P == -1 ? "^o" : ""}_${serializeHalfInteger(term.J)}`;
}

export function serializeLS1(e: LS1DescriptorImpl): string {
  return (
    serializeShellConfig(e.config.core.config)
    + "{"
    + serializeLSTermImpl(e.config.core.term)
    + "}"
    + serializeShellConfig(e.config.excited.config)
    + "{"
    + serializeLSTermImpl(e.config.excited.term)
    + "}"
    + serializeLS1Term(e.term)
  );
}

function serializeLatexLS1Term(term: LS1Term): string {
  return `\\mathrm{${atomicOrbital[term.L]}}^{${2 * term.S + 1}}[${
    serializeHalfInteger(term.K)
  }]${term.P == -1 ? "^o" : ""}_{${serializeHalfInteger(term.J)}}`;
}

export function serializeLatexLS1(e: LS1DescriptorImpl): string {
  return (
    serializeShellConfig(e.config.core.config)
    + "("
    + serializeLatexLSTermImpl(e.config.core.term)
    + ")"
    + serializeShellConfig(e.config.excited.config)
    + "("
    + serializeLatexLSTermImpl(e.config.excited.term)
    + ")"
    + serializeLatexLS1Term(e.term)
  );
}
