// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { SerializedSpecies } from "@lxcat/database/schema";
import type { SetHeader } from "@lxcat/schema";
import type { CrossSectionInfo, Reaction } from "@lxcat/schema/process";

export type DenormalizedProcess = {
  reaction: Reaction<SerializedSpecies>;
  info: CrossSectionInfo<string> & {
    _key: string;
    isPartOf: Array<SetHeader>;
  };
};
