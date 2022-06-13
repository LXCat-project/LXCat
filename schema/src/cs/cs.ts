import { CSL } from "../core/csl";
import { Reaction } from "../core/reaction";
import { CSStorage } from "./data_types";

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
