import { CSParameters } from "@lxcat/schema/dist/cs/cs";
import { CSStorage } from "@lxcat/schema/dist/cs/data_types";
import { Reaction } from "@lxcat/schema/dist/core/reaction";
import { Reference } from "@lxcat/schema/dist/core/reference";

import { State } from "../shared/types/collections";
import { VersionInfo } from "../shared/types/version_info";

// Public facing types.
export interface CrossSectionHeading {
  id: string;
  isPartOf: CrossSectionSet;
  reaction: Reaction<State>;
  references: Reference[];
}

export type CrossSectionItem = {
  id: string;
  isPartOf: Array<CrossSectionSet & { id: string }>;
  reaction: Reaction<State>;
  reference: Reference[];
} & Omit<CrossSection, "reaction">;

export type OrphanedCrossSectionItem = Omit<CrossSectionItem, "isPartOf">;

export interface CrossSectionSetHeading extends CrossSectionSet {
  id: string;
  processes: Omit<CrossSectionHeading, "isPartOf">[];
  contributor: string;
}

export interface CrossSectionSetItem extends CrossSectionSet {
  id: string;
  processes: OrphanedCrossSectionItem[];
  contributor: string;
}

// Database types.
export interface CrossSectionSet {
  name: string;
  description: string;
  complete: boolean;
  organization: string;
  versionInfo: VersionInfo;
}

export type CrossSection = {
  reaction: string; // A key in Reaction collection
  parameters?: CSParameters;
  threshold: number;
  organization: string; // A key in Organization collection
  versionInfo: VersionInfo;
} & CSStorage;
