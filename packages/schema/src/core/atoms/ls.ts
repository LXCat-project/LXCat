// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: Apache-2.0

import { AtomicGenerator, AtomicDBGenerator } from "../generators";
import { ConfigTerm, TotalAngularSpecifier } from "./common";
import { CouplingScheme } from "./coupling_scheme";

export interface LSTermImpl {
  L: number;
  S: number;
  P: -1 | 1;
}

export type LSTerm = LSTermImpl & TotalAngularSpecifier;

export type AtomLSImpl = ConfigTerm<CouplingScheme.LS, LSTerm>;

export type AtomLS = AtomicGenerator<AtomLSImpl, "AtomLS">;
export type AtomLS_DB = AtomicDBGenerator<AtomLSImpl, "AtomLS">;
