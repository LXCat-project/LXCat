// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ReactionTypeTag } from "@lxcat/schema/process";
import type { StateSummary } from "@lxcat/schema/species";
import type { AnySpecies } from "@lxcat/schema/species";
export type { Reference } from "@lxcat/schema";

// The 'name' field can be used as the id of the document.
type ElectronConfiguration = Array<Array<number>>;
export interface Particle {
  name: string;
  charge: number;
  electron_configuration?: ElectronConfiguration;
}

export interface Contributor {
  name: string;
}

// Since all states will be in the same schema, we need a single compound
// type to encompass the types of all objects in the table.
export type State = { detailed: AnySpecies; serialized: StateSummary };

// Reaction should be linked to its input/output states/particles through graph edges.
export interface Reaction {
  reversible: boolean;
  typeTags: Array<ReactionTypeTag>;
}
