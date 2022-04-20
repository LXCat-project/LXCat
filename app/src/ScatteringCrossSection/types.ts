import { CSL } from "../shared/types/csl";
import { InputDocument } from "../shared/types/document";
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

export type CrossSectionInput<StateType> = InputDocument<
  StateType,
  CrossSection<string, string>
> & { complete: boolean };
