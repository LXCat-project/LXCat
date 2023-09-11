// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { InputDocument } from "../core/document";
import { TypeTag } from "../core/generators";
import { AnySpecies } from "../core/species";
import { CrossSection } from "../cs/cs";

/**
 * @minLength 1
 */
type LookupString = string;

export type CrossSectionInput<StateType extends TypeTag<string>> =
  & InputDocument<
    StateType,
    CrossSection<LookupString, LookupString> & { id?: string }
  >
  & { complete: boolean };

/**
 * To add a cross section set to the LXCat application, the set should be valid against this schema.
 */
// TODO: Rename this.
export type CrossSectionSetRaw = CrossSectionInput<AnySpecies>;
