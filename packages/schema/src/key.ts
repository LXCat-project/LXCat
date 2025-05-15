// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { globalRegistry, string } from "zod";

export const Key = string().min(1);

globalRegistry.add(Key, { id: "Key" });
