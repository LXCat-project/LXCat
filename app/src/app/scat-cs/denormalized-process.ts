import { CrossSection } from "@lxcat/database/dist/cs/collections";
import { CrossSectionSet } from "@lxcat/database/dist/css/collections";
import { State } from "@lxcat/database/dist/shared/types/collections";
import { type Reaction } from "@lxcat/schema/process";

export type DenormalizedProcess = {
  id: string;
  reaction: Reaction<State>;
  isPartOf: Array<Omit<CrossSectionSet, "versionInfo">>;
  reference: Array<string>;
} & Pick<CrossSection, "info">;
