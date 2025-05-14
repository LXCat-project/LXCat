// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { literal, output, tuple } from "zod";
import { Element } from "./element.js";

export const AtomComposition = tuple([tuple([Element, literal(1)])]);
export type AtomComposition = output<typeof AtomComposition>;
