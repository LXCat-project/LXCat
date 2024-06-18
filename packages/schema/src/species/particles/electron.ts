// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { literal, object } from "zod";

export const Electron = object({
  type: literal("Electron"),
  composition: literal("e"),
  charge: literal(-1),
});
