// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import {
  object,
  UnknownKeysParam,
  ZodObject,
  ZodRawShape,
  ZodTypeAny,
} from "zod";
import { Key } from "./key.js";

export const partialKeyed = <
  Shape extends ZodRawShape,
  UnknownKeys extends UnknownKeysParam,
  Catchall extends ZodTypeAny,
>(Base: ZodObject<Shape, UnknownKeys, Catchall>) =>
  Base.merge(object({ _key: Key.optional() }));
