// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { discriminatedUnion, output } from "zod";
import { AtomJ1L2 } from "./j1l2";
import { AtomLS } from "./ls";
import { AtomLS1 } from "./ls1";

export const AnyAtom = discriminatedUnion("type", [
  AtomLS.plain,
  AtomLS1.plain,
  AtomJ1L2.plain,
]);
export type AnyAtom = output<typeof AnyAtom>;

export const AnyAtomSerializable = discriminatedUnion("type", [
  AtomLS.serializable,
  AtomLS1.serializable,
  AtomJ1L2.serializable,
]);
export type AnyAtomSerializable = output<typeof AnyAtomSerializable>;
