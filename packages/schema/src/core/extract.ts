// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { Atom, Molecule, UnknownAtom, UnknownMolecule } from "./generators";
import { State } from "./state";

export type ExtractElectronic<M extends UnknownMolecule> = M extends
  Molecule<string, infer E, unknown, unknown> ? E
  : never;
export type ExtractVibrational<M extends UnknownMolecule> = M extends
  Molecule<string, unknown, infer V, unknown> ? V
  : never;
export type ExtractRotational<M extends UnknownMolecule> = M extends
  Molecule<string, unknown, unknown, infer R> ? R
  : never;

export type ExtractAtomic<A extends UnknownAtom> = A extends
  Atom<string, infer E> ? E : never;

export type ExtractGenerator<S extends State<unknown>> = S extends State<
  infer G
> ? G
  : never;
