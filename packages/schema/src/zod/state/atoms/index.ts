// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { AtomJ1L2 } from "./j1l2";
import { AtomLS } from "./ls";
import { AtomLS1 } from "./ls1";

export const AnyAtom = z.discriminatedUnion("type", [
  AtomLS,
  AtomLS1,
  AtomJ1L2,
]);
export type AnyAtom = z.input<typeof AnyAtom>;
