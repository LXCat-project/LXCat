// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type SerializedSpecies } from "@lxcat/database/schema";
import { type Reaction } from "@lxcat/schema/process";
import { Latex } from "../shared/latex";
import { reactionAsLatex } from "./reaction";

export const ReactionSummary = (props: Reaction<SerializedSpecies>) => {
  const label = reactionAsLatex(props);
  return <Latex>{label}</Latex>;
};
