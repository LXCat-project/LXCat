// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Key, VersionInfo } from "@lxcat/schema";
import { object, TypeOf } from "zod";

export const KeyedVersionInfo = VersionInfo.merge(object({ _key: Key }));
export type KeyedVersionInfo = TypeOf<typeof KeyedVersionInfo>;
