// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { literal, tuple, union } from "zod";
import { Element } from "../element.js";

export const HomonuclearCompositionDescriptor = tuple([
  tuple([Element, literal(2)]),
]).or(
  tuple([
    tuple([union([literal("H"), literal("D"), literal("T")]), literal(1)]),
    tuple([union([literal("H"), literal("D"), literal("T")]), literal(1)]),
  ]),
);
