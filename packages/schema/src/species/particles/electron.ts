// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { literal, object } from "zod";
import { registerType } from "../../common/util.js";

export const Electron = object({
  type: literal("Electron"),
  composition: literal("e"),
  charge: literal(-1),
});

registerType(Electron, { id: "Electron" });
