// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type VersionInfo } from "@lxcat/schema";

export interface KeyedVersionInfo extends VersionInfo {
  _key: string;
}
