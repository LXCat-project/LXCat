// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { literal, tuple, TypeOf } from "zod";
import { Element } from "./element.js";

export const AtomComposition = tuple([tuple([Element, literal(1)])]);
export type AtomComposition = TypeOf<typeof AtomComposition>;
