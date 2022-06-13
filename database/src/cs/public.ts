import { Reference } from "@lxcat/schema/dist/core/reference";
import { Reaction } from "@lxcat/schema/dist/core/reaction";
import { CrossSection } from "../cs/collections";
import { CrossSectionSet } from "../css/collection";
import { State } from "../shared/types/collections";

export interface CrossSectionHeading {
  id: string;
  isPartOf: CrossSectionSet;
  reaction: Reaction<State>;
  reference: Reference[];
  // TODO add CrossSection.threshold? Is it useful when searching for a section?
}

export type CrossSectionItem = {
  id: string;
  isPartOf: CrossSectionSet & { id: string };
  reaction: Reaction<State>;
  reference: Reference[];
} & Omit<CrossSection, "reaction">;
