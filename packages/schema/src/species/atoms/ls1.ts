// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, input, literal, number, object, TypeOf, union } from "zod";
import { makeComponent } from "../component.js";
import { AtomComposition } from "../composition/atom.js";
import { SpeciesBase } from "../composition/species-base.js";
import { makeAtom } from "../generators.js";
import {
  atomicOrbital,
  buildTerm,
  buildTwoTerm,
  serializeHalfInteger,
  serializeShellConfig,
  ShellEntry,
  TotalAngularSpecifier,
} from "./common.js";
import {
  LSTermUncoupled,
  serializeLatexLSTermImpl,
  serializeLSTermImpl,
} from "./ls.js";

export const LS1Term = object({
  L: number().int().nonnegative(),
  K: number().multipleOf(0.5).nonnegative(),
  S: number().multipleOf(0.5).nonnegative(),
  P: union([literal(-1), literal(1)]),
}).merge(TotalAngularSpecifier);
export type LS1Term = TypeOf<typeof LS1Term>;

export const LS1Descriptor = buildTerm(
  buildTwoTerm(
    buildTerm(array(ShellEntry), LSTermUncoupled),
    buildTerm(array(ShellEntry), LSTermUncoupled),
  ),
  LS1Term,
);
export type LS1Descriptor = TypeOf<typeof LS1Descriptor>;

/// Serializer functions

function serializeLS1Term(term: LS1Term): string {
  return `${atomicOrbital[term.L]}^${2 * term.S + 1}[${
    serializeHalfInteger(
      term.K,
    )
  }]${term.P == -1 ? "^o" : ""}_${serializeHalfInteger(term.J)}`;
}

export function serializeLS1(e: LS1Descriptor): string {
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

export function serializeLatexLS1(e: LS1Descriptor): string {
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

export const LS1Component = makeComponent(
  LS1Descriptor,
  serializeLS1,
  serializeLatexLS1,
);

export const AtomLS1 = makeAtom(
  "AtomLS1",
  SpeciesBase(AtomComposition),
  LS1Component,
);
export type AtomLS1 = input<typeof AtomLS1.plain>;
