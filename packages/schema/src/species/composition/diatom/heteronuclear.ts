// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { literal, tuple } from "zod";
import { Element } from "../element.js";

export const HeteronuclearDiatomComposition = tuple([
  tuple([Element, literal(1)]),
  tuple([Element, literal(1)]),
]).check(
  (ctx) => {
    if (ctx.value[0][0] === ctx.value[1][0]) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        message:
          `Chemical composition of heteronuclear diatom contains equal elements ${
            ctx.value[0][0]
          }, use the "HomonuclearDiatom" species type instead.`,
      });
    }
  },
);
