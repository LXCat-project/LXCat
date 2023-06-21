// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CSL } from "@lxcat/schema/dist/core/csl";

export type Bibliography = {
  sets: Array<
    { id: string; name: string; organization: string; publishedIn: string }
  >;
  processes: Array<{ id: string; references: Array<string> }>;
  references: Record<string, CSL.Data>;
};
