// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { object, ZodObject, ZodRawShape } from "zod";
import { Key } from "./key.js";
import { VersionInfo } from "./version-info.js";

export const versioned = <
  Shape extends ZodRawShape,
  InExtra extends Record<string, unknown>,
  OutExtra extends Record<string, unknown>,
>(Base: ZodObject<Shape, InExtra, OutExtra>) =>
  object({ ...Base.shape, _key: Key, versionInfo: VersionInfo });
