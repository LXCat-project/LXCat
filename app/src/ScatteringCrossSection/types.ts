import { CSL } from "../shared/types/csl";
import { Reaction } from "../shared/types/reaction";
import { CSStorage } from "./types/data_types";

export interface CSParameters {
  mass_ratio?: number;
  statistical_weight_ratio?: number;
}

export type CrossSection<
  StateType,
  ReferenceType = string | CSL.Data,
  StorageType = CSStorage
> = {
  reaction: Reaction<StateType>;
  parameters?: CSParameters;
  reference?: Array<ReferenceType>;
  threshold: number;
} & StorageType;
