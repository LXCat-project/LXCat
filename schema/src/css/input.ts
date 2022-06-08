import { CrossSection } from "../cs/cs";
import { InputDocument } from "../core/document";

export type CrossSectionInput<StateType> = InputDocument<
  StateType,
  CrossSection<string, string>
> & { complete: boolean };

// TODO should set have own references?
export type CrossSectionSetInput = CrossSectionInput<any>;
