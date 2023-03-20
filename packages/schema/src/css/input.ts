// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { AnyAtomJSON } from "../core/atoms";
import { InputDocument } from "../core/document";
import { AnyMoleculeJSON } from "../core/molecules";
import { CrossSection } from "../cs/cs";

/**
 * @minLength 1
 */
type LookupString = string;

export type CrossSectionInput<StateType> =
  & InputDocument<
    StateType,
    CrossSection<LookupString, LookupString> & { id?: string }
  >
  & { complete: boolean };

// TODO should set have own references?
/**
 * To add a cross section set to the LXCat application, the set should be valid against this schema.
 */
export type CrossSectionSetRaw = CrossSectionInput<
  AnyAtomJSON | AnyMoleculeJSON
>;
