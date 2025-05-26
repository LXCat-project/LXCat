// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, object, TypeOf } from "zod";
import { makeComponent } from "../component.js";
import { AtomComposition } from "../composition/atom.js";
import { SpeciesBase } from "../composition/species-base.js";
import { makeAtom } from "../generators.js";
import {
  buildTerm,
  serializeHalfInteger,
  serializeShellConfig,
  ShellEntry,
  TotalAngularSpecifier,
} from "./common.js";
import { LSTerm, serializeLatexLSTerm, serializeLSTerm } from "./ls.js";

export const LSJTerm = object({
  ...LSTerm.shape,
  ...TotalAngularSpecifier.shape,
});
export type LSJTerm = TypeOf<typeof LSJTerm>;

export const LSJDescriptor = buildTerm(array(ShellEntry), LSJTerm);
type LSJDescriptor = TypeOf<typeof LSJDescriptor>;

export const serializeLSJTerm = (term: LSJTerm): string => {
  return `${serializeLSTerm(term)}_${serializeHalfInteger(term.J)}`;
};

export const serializeLSJ = (e: LSJDescriptor): string => {
  const config = serializeShellConfig(e.config);
  return `${config}${config !== "" ? ":" : ""}${serializeLSJTerm(e.term)}`;
};

export const serializeLatexLSJTerm = (term: LSJTerm): string => {
  return `${serializeLatexLSTerm(term)}_{${serializeHalfInteger(term.J)}}`;
};

export const serializeLatexLSJ = (e: LSJDescriptor): string => {
  const config = serializeShellConfig(e.config);
  return `${config}${config != "" ? ":" : ""}${serializeLatexLSJTerm(e.term)}`;
};

export const LSJComponent = makeComponent(
  LSJDescriptor,
  serializeLSJ,
  serializeLatexLSJ,
);
export type LSJComponent = TypeOf<typeof LSJComponent>;

// TODO: After migration this type should be renamed to `AtomLSJ`.
export const AtomLSJ = makeAtom(
  "AtomLS",
  SpeciesBase(AtomComposition),
  LSJComponent,
);
