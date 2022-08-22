import { Reference } from "@lxcat/schema/dist/core/reference";
import { Reaction } from "@lxcat/schema/dist/core/reaction";
import { CrossSection } from "../cs/collections";
import { CrossSectionSet } from "../css/collections";
import { State } from "../shared/types/collections";

export interface CrossSectionHeading {
  id: string;
  isPartOf: string[]; // Names of set
  reaction: Reaction<State>;
  reference: Reference[];
  // TODO add CrossSection.threshold? Is it useful when searching for a section?
}

export type CrossSectionItem = {
  id: string;
  isPartOf: Array<CrossSectionSet & { id: string }>;
  reaction: Reaction<State>;
  reference: Reference[];
} & Omit<CrossSection, "reaction">;
