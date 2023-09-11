// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { atom } from "../generators";
import {
  atomicOrbital,
  buildTerm,
  serializeHalfInteger,
  serializeShellConfig,
  ShellEntry,
  TotalAngularSpecifier,
} from "./common";

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
  summary: () => serializeLS(atom),
  latex: () => serializeLatexLS(atom),
}));
export type LSDescriptor = z.input<typeof LSDescriptor>;

export const AtomLS = atom("AtomLS", LSDescriptor);
export type AtomLS = z.input<typeof AtomLS>;

export const serializeLSTermImpl = (term: LSTermImpl): string => {
  return `^${2 * term.S + 1}${atomicOrbital[term.L]}${
    term.P == -1 ? "^o" : ""
  }`;
};

export const serializeLSTerm = (term: LSTerm): string => {
  return `${serializeLSTermImpl(term)}_${serializeHalfInteger(term.J)}`;
};

export const serializeLS = (e: LSDescriptorImpl): string => {
  const config = serializeShellConfig(e.config);
  return `${config}${config !== "" ? ":" : ""}${serializeLSTerm(e.term)}`;
};

export const serializeLatexLSTermImpl = (term: LSTermImpl): string => {
  return `{}^{${2 * term.S + 1}}\\mathrm{${atomicOrbital[term.L]}}${
    term.P == -1 ? "^o" : ""
  }`;
};

export const serializeLatexLSTerm = (term: LSTerm): string => {
  return `${serializeLatexLSTermImpl(term)}_{${serializeHalfInteger(term.J)}}`;
};

const serializeLatexLS = (e: LSDescriptorImpl): string => {
  const config = serializeShellConfig(e.config);
  return `${config}${config != "" ? ":" : ""}${serializeLatexLSTerm(e.term)}`;
};
