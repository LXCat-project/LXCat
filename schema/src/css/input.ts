import { CrossSection } from "../cs/cs";
import { InputDocument } from "../core/document";
import { AnyAtomJSON } from "../core/atoms";
import { AnyMoleculeJSON } from "../core/molecules";

export type CrossSectionInput<StateType> = InputDocument<
  StateType,
  CrossSection<string, string>
> & { complete: boolean };

// TODO should set have own references?
// TODO do not disable linter
export type CrossSectionSetInput = CrossSectionInput<
  AnyAtomJSON | AnyMoleculeJSON
>;
