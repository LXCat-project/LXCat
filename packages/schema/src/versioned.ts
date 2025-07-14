// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { object, ZodObject, ZodRawShape } from "zod";
import { $ZodObjectConfig } from "zod/v4/core";
import { Key } from "./key.js";
import { VersionInfo } from "./version-info.js";

export const versioned = <
  Shape extends ZodRawShape,
  Config extends $ZodObjectConfig,
>(Base: ZodObject<Shape, Config>) =>
  object({ ...Base.shape, _key: Key, versionInfo: VersionInfo });
