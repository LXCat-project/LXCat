// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ReactionTemplate, Reversible } from "./types.js";

export const defaultReactionTemplate = (): ReactionTemplate => ({
  consumes: [{}],
  produces: [{}],
  typeTags: [],
  reversible: Reversible.Both,
  set: [],
});

export const defaultSearchTemplate = () => [defaultReactionTemplate()];
