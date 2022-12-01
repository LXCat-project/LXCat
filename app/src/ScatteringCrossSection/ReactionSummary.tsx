// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { State } from "@lxcat/database/dist/shared/types/collections";
import { Reaction } from "@lxcat/schema/dist/core/reaction";
import { Latex } from "../shared/Latex";

import { reactionAsLatex } from "./reaction";

export const ReactionSummary = (props: Reaction<State>) => {
  const label = reactionAsLatex(props);
  return <Latex>{label}</Latex>;
};
