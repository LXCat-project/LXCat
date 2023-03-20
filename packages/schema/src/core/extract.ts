// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import {
  AtomicGenerator,
  MolecularGenericGenerator,
  UnknownMolecule,
} from "./generators";
import { State } from "./state";

export type ExtractElectronic<M extends UnknownMolecule> = M extends
  MolecularGenericGenerator<infer E, unknown, unknown, string> ? E
  : never;
export type ExtractVibrational<M extends UnknownMolecule> = M extends
  MolecularGenericGenerator<unknown, infer V, unknown, string> ? V
  : never;
export type ExtractRotational<M extends UnknownMolecule> = M extends
  MolecularGenericGenerator<unknown, unknown, infer R, string> ? R
  : never;

export type ExtractAtomic<A extends AtomicGenerator<unknown, string>> =
  A extends AtomicGenerator<infer E, string> ? E : never;

export type ExtractGenerator<S extends State<unknown>> = S extends State<
  infer G
> ? G
  : never;
