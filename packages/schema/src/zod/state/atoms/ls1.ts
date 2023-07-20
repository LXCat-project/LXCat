// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { atom } from "../generators";
import {
  buildTerm,
  buildTwoTerm,
  ShellEntry,
  TotalAngularSpecifier,
} from "./common";
import { LSTermImpl } from "./ls";

export const LS1TermImpl = z.object({
  L: z.number().int().nonnegative(),
  K: z.number().multipleOf(0.5).nonnegative(),
  S: z.number().multipleOf(0.5).nonnegative(),
  P: z.union([z.literal(-1), z.literal(1)]),
});

export const LS1Term = LS1TermImpl.merge(TotalAngularSpecifier);

export const AtomLS1Impl = buildTerm(
  z.array(ShellEntry),
  buildTwoTerm(
    buildTerm(z.array(ShellEntry), LSTermImpl),
    buildTerm(z.array(ShellEntry), LSTermImpl),
  ),
).transform((atom) => ({
  ...atom,
  summary: "LS1",
  latex: "LS1",
}));

export const AtomLS1 = atom("AtomLS1", AtomLS1Impl);
export type AtomLS1 = z.input<typeof AtomLS1>;
