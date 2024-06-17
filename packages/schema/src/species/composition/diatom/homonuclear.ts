// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { literal, tuple } from "zod";
import { Element } from "../element.js";

export const HomonuclearCompositionDescriptor = tuple([
  tuple([Element, literal(2)]),
]);
