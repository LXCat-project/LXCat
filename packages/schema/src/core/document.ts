// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { TypeTag } from "./generators";
import { Reference } from "./reference";
import { State } from "./state";
import { Dict } from "./util";

export type SelfReference = {
  // TODO add @format uri, do later as it causes failure in
  // form resolver in /app/src/ScatteringCrossSectionSet/EditForm.tsx
  // , because the used ajvResolver does not include
  // ajv-formats (https://ajv.js.org/packages/ajv-formats.html)
  // see https://github.com/react-hook-form/resolvers/issues/432
  /**
   * URL to JSON schema of this document.
   *
   * @minLength 1
   */
  $schema?: string;
  /**
   * URL where dataset was downloaded from.
   *
   * @minLength 1
   */
  url?: string;
  /**
   * URL to terms of use.
   *
   * @minLength 1
   */
  terms_of_use?: string;
};

export type SetHeader = {
  /**
   * @minLength 1
   */
  contributor: string;
  /**
   * @minLength 1
   */
  name: string;

  /**
   * A key into the `references` dict. This is a reference to the paper that
   * presents this dataset.
   */
  publishedIn?: string;
  /**
   * A description of this dataset.
   */
  description: string;
};

/**
 * @internal
 */
export type InputDocument<StateType extends TypeTag<string>, ProcessType> =
  & SelfReference
  & SetHeader
  & {
    // cite: Reference; // Should only be in output.
    // Disabled this field as its use is currently unclear.
    // publication?: Reference; // Should this field instead hold a key into 'references'?
    // TODO for validation the keys should be unique and the values as well
    references: Dict<Reference>;
    // TODO for validation the keys should be unique and the values as well
    states: Dict<State<StateType>>;
    /**
     * @minItems 1
     * @uniqueItems true
     */
    processes: Array<ProcessType>;
  };
