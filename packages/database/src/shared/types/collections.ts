import { AtomJ1L2_DB } from "@lxcat/schema/dist/core/atoms/j1l2";
import { AtomLS_DB } from "@lxcat/schema/dist/core/atoms/ls";
import { AtomLS1_DB } from "@lxcat/schema/dist/core/atoms/ls1";
import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { HeteronuclearDiatom_DB } from "@lxcat/schema/dist/core/molecules/diatom_heteronuclear";
import { HomonuclearDiatom_DB } from "@lxcat/schema/dist/core/molecules/diatom_homonuclear";
import { LinearTriatomInversionCenter_DB } from "@lxcat/schema/dist/core/molecules/triatom_linear_inversion_center";
import { DBState } from "@lxcat/schema/dist/core/state";
export type { Reference } from "@lxcat/schema/dist/core/reference";

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
export type State = DBState<
  | AtomLS_DB
  | AtomJ1L2_DB
  | AtomLS1_DB
  | HomonuclearDiatom_DB
  | HeteronuclearDiatom_DB
  | LinearTriatomInversionCenter_DB
>;

// Reaction should be linked to its input/output states/particles through graph edges.
export interface Reaction {
  reversible: boolean;
  type_tags: Array<ReactionTypeTag>;
}
