import type { SerializedSpecies } from "@lxcat/database/dist/schema/species";
import type { SetHeader } from "@lxcat/schema";
import type { CrossSectionInfo, Reaction } from "@lxcat/schema/process";

export type DenormalizedProcess = {
  reaction: Reaction<SerializedSpecies>;
  info: CrossSectionInfo<string> & {
    _key: string;
    isPartOf: Array<SetHeader>;
  };
};
