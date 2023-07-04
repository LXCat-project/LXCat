// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { Atom } from "../generators";
import { ConfigTerm, TotalAngularSpecifier, TwoTermConfig } from "./common";
import { CouplingScheme } from "./coupling_scheme";
import { AtomLSImpl, LSTermImpl } from "./ls";

export interface J1L2TermImpl {
  K: number;
  S: number;
  P: number;
}
export type J1L2Term = J1L2TermImpl & TotalAngularSpecifier;

export type AtomJ1L2Impl = ConfigTerm<
  CouplingScheme.J1L2,
  J1L2Term,
  TwoTermConfig<AtomLSImpl, ConfigTerm<CouplingScheme.LS, LSTermImpl>>
>;

export type AtomJ1L2 = Atom<"AtomJ1L2", AtomJ1L2Impl>;
