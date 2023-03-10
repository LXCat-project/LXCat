// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { defaultSearchTemplate } from "@lxcat/database/dist/cs/picker/default";
import { ReactionTemplate } from "@lxcat/database/dist/cs/picker/types";
import { ParsedUrlQuery } from "querystring";

export function getTemplateFromQuery(
  query: ParsedUrlQuery,
): Array<ReactionTemplate> {
  return query.reactions && !Array.isArray(query.reactions)
    ? JSON.parse(query.reactions)
    : defaultSearchTemplate();
}
