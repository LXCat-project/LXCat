// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CSParameters } from "@lxcat/schema/dist/cs/cs";
import { CSStorage } from "@lxcat/schema/dist/cs/data_types";
import { VersionInfo } from "../shared/types/version_info";

export type CrossSection = {
  reaction: string; // A key in Reaction collection
  parameters?: CSParameters;
  threshold: number;
  organization: string; // A key in Organization collection
  versionInfo: VersionInfo;
} & CSStorage;
