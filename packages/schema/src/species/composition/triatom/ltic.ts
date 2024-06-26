// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

// NOTE: LTIC is short for LinearTriatomInversionCenter.

import { literal, tuple, union } from "zod";
import { Element } from "../element.js";

export const LTICComposition = union([
  tuple([tuple([Element, literal(1)]), tuple([Element, literal(2)])]),
  tuple([tuple([Element, literal(2)]), tuple([Element, literal(1)])]),
  tuple([tuple([Element, literal(3)])]),
]);
