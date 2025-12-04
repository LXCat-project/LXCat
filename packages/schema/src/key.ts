// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { string } from "zod";
import { registerType } from "./common/util.js";

export const Key = string().min(1);

registerType(Key, { id: "Key" });
