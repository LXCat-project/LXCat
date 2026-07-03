// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { literal, object, output, string } from "zod";
import { registerType } from "../../common/util.js";

// NOTE: The expression's unit literals carry its dimensions, so no `unit`
// property is stored alongside it. `chemcat-global` verifies the content
// against the rate-coefficient unit of the reaction at load time.
export const Expression = object({
  type: literal("Expression"),
  expression: string().min(1),
});
export type Expression = output<typeof Expression>;

registerType(Expression, { id: "Expression" });
