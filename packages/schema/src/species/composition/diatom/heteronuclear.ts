// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { literal, tuple } from "zod";
import { Element } from "../element.js";

export const HeteronuclearDiatomComposition = tuple([
  tuple([Element, literal(1)]),
  tuple([Element, literal(1)]),
]).refine(
  (composition) => composition[0][0] !== composition[1][0],
  (composition) => ({
    message:
      `Chemical composition of heteronuclear diatom contains equal elements ${
        composition[0][0]
      }, use the "HomonuclearDiatom" species type instead.`,
  }),
);
