// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { makeComponent } from "../component.js";
import { AtomComposition } from "../composition/atom.js";
import { SpeciesBase } from "../composition/species-base.js";
import { makeAtom } from "../generators.js";
import {
  atomicOrbital,
  buildTerm,
  serializeHalfInteger,
  serializeShellConfig,
  ShellEntry,
  TotalAngularSpecifier,
} from "./common.js";

export const LSTermUncoupled = z.object({
  L: z.number().int().nonnegative(),
  S: z.number().multipleOf(0.5).nonnegative(),
  P: z.union([z.literal(-1), z.literal(1)]),
});
export type LSTermUncoupled = z.input<typeof LSTermUncoupled>;

export const LSTerm = LSTermUncoupled.merge(TotalAngularSpecifier);
export type LSTerm = z.input<typeof LSTerm>;

export const LSDescriptor = buildTerm(z.array(ShellEntry), LSTerm);
type LSDescriptor = z.infer<typeof LSDescriptor>;

/// Serializer functions

export const serializeLSTermImpl = (term: LSTermUncoupled): string => {
  return `^${2 * term.S + 1}${atomicOrbital[term.L]}${
    term.P == -1 ? "^o" : ""
  }`;
};

export const serializeLSTerm = (term: LSTerm): string => {
  return `${serializeLSTermImpl(term)}_${serializeHalfInteger(term.J)}`;
};

export const serializeLS = (e: LSDescriptor): string => {
  const config = serializeShellConfig(e.config);
  return `${config}${config !== "" ? ":" : ""}${serializeLSTerm(e.term)}`;
};

export const serializeLatexLSTermImpl = (term: LSTermUncoupled): string => {
  return `{}^{${2 * term.S + 1}}\\mathrm{${atomicOrbital[term.L]}}${
    term.P == -1 ? "^o" : ""
  }`;
};

export const serializeLatexLSTerm = (term: LSTerm): string => {
  return `${serializeLatexLSTermImpl(term)}_{${serializeHalfInteger(term.J)}}`;
};

export const serializeLatexLS = (e: LSDescriptor): string => {
  const config = serializeShellConfig(e.config);
  return `${config}${config != "" ? ":" : ""}${serializeLatexLSTerm(e.term)}`;
};

export const LSComponent = makeComponent(
  LSDescriptor,
  serializeLS,
  serializeLatexLS,
);
export type LSComponent = z.output<typeof LSComponent>;

export const AtomLS = makeAtom(
  "AtomLS",
  SpeciesBase(AtomComposition),
  LSComponent,
);
export type AtomLS = z.input<typeof AtomLS.plain>;
