// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  defaultSearchTemplate,
  ReactionTemplate,
} from "@lxcat/database/item/picker";
import { ParsedUrlQuery } from "querystring";
import { reactionTemplatesSchema } from "./picker/schemas";

/** The reaction templates in the URL, or the default one when there are none. */
export function getTemplateFromQuery(
  query: ParsedUrlQuery,
): Array<ReactionTemplate> {
  if (query.reactions && !Array.isArray(query.reactions)) {
    try {
      const templates = reactionTemplatesSchema.safeParse(
        JSON.parse(query.reactions),
      );
      if (templates.success) {
        return templates.data;
      }
    } catch {
      // Not JSON, which is as invalid as a template of the wrong shape.
    }
  }

  return defaultSearchTemplate();
}
