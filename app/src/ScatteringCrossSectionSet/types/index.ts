import { CrossSection } from "../../ScatteringCrossSection/types";
import { InputDocument } from "../../shared/types/document";

export type CrossSectionInput<StateType> = InputDocument<
  StateType, CrossSection<string, string>
> & { complete: boolean; };

export type CrossSectionSetInput = CrossSectionInput<any>;
