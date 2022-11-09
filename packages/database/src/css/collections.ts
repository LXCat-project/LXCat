// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { VersionInfo } from "../shared/types/version_info";

export interface CrossSectionSet {
  name: string;
  description: string;
  complete: boolean;
  organization: string;
  versionInfo: VersionInfo;
}
