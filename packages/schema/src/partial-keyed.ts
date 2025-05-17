// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { object, ZodObject, ZodRawShape } from "zod";
import { Key } from "./key.js";

export const PartialKeyed = <
  Shape extends ZodRawShape,
  InExtra extends Record<string, unknown>,
  OutExtra extends Record<string, unknown>,
>(Base: ZodObject<Shape, InExtra, OutExtra>) =>
  object({ _key: Key.optional(), ...Base.shape });
