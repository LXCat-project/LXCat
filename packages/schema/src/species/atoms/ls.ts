// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import {
  array,
  globalRegistry,
  literal,
  number,
  object,
  TypeOf,
  union,
} from "zod";
import { makeComponent } from "../component.js";
import { AtomComposition } from "../composition/atom.js";
import { SpeciesBase } from "../composition/species-base.js";
import { makeAtom } from "../generators.js";
import {
  atomicOrbital,
  buildTerm,
  serializeShellConfig,
  ShellEntry,
} from "./common.js";

export const LSTerm = object({
  L: number().int().nonnegative(),
  S: number().multipleOf(0.5).nonnegative(),
  P: union([literal(-1), literal(1)]),
});
export type LSTerm = TypeOf<typeof LSTerm>;

export const LSDescriptor = buildTerm(array(ShellEntry), LSTerm);
type LSDescriptor = TypeOf<typeof LSDescriptor>;

/// Serializer functions

export const serializeLSTerm = (term: LSTerm): string => {
  return `^${2 * term.S + 1}${atomicOrbital[term.L]}${
    term.P == -1 ? "^o" : ""
  }`;
};

export const serializeLS = (e: LSDescriptor): string => {
  const config = serializeShellConfig(e.config);
  return `${config}${config !== "" ? ":" : ""}${serializeLSTerm(e.term)}`;
};

export const serializeLatexLSTerm = (term: LSTerm): string => {
  return `{}^{${2 * term.S + 1}}\\mathrm{${atomicOrbital[term.L]}}${
    term.P == -1 ? "^o" : ""
  }`;
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
export type LSComponent = TypeOf<typeof LSComponent>;

// TODO: After migration, this type should be renamed to `AtomLS`.
export const AtomLS = makeAtom(
  "AtomLSUncoupled",
  SpeciesBase(AtomComposition),
  LSComponent,
);
export type AtomLS = TypeOf<typeof AtomLS.plain>;

globalRegistry.add(AtomLS.plain, { id: "AtomLSUncoupled" });
