// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { VersionInfo } from "@lxcat/schema";
import { type CrossSectionInfo } from "@lxcat/schema/process";

export type CrossSection = {
  versionInfo: VersionInfo;
  organization: string; // A key in Organization collection
  reaction: string; // A key in Reaction collection
  info: Omit<CrossSectionInfo<unknown>, "references">;
};
