// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { discriminatedUnion, output } from "zod";
import { Atom } from "./atom.js";
import { AtomJ1L2 } from "./j1l2.js";
import { AtomLS } from "./ls.js";
import { AtomLS1 } from "./ls1.js";
import { AtomLSJ } from "./lsj.js";
import { AtomUnspecified } from "./unspecified.js";

export const AnyAtom = discriminatedUnion("type", [
  Atom,
  AtomUnspecified.plain,
  AtomLS.plain,
  AtomLSJ.plain,
  AtomLS1.plain,
  AtomJ1L2.plain,
]);
export type AnyAtom = output<typeof AnyAtom>;

export const AnyAtomSerializable = discriminatedUnion("type", [
  Atom,
  AtomUnspecified.serializable,
  AtomLS.serializable,
  AtomLSJ.serializable,
  AtomLS1.serializable,
  AtomJ1L2.serializable,
]);
export type AnyAtomSerializable = output<typeof AnyAtomSerializable>;
