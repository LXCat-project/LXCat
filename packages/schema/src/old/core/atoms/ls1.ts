// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { Atom } from "../generators";
import { ConfigTerm, TotalAngularSpecifier, TwoTermConfig } from "./common";
import { CouplingScheme } from "./coupling_scheme";
import { LSTermImpl } from "./ls";

export interface LS1TermImpl {
  L: number;
  K: number;
  S: number;
  P: -1 | 1;
}
export type LS1Term = LS1TermImpl & TotalAngularSpecifier;

export type AtomLS1Impl = ConfigTerm<
  CouplingScheme.LS1,
  LS1Term,
  TwoTermConfig<
    ConfigTerm<CouplingScheme.LS, LSTermImpl>,
    ConfigTerm<CouplingScheme.LS, LSTermImpl>
  >
>;

export type AtomLS1 = Atom<"AtomLS1", AtomLS1Impl>;
