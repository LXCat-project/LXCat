// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { Reference } from "./reference";
import { InState } from "./state";
import { Dict } from "./util";

export interface SelfReference {
  /**
   * URL to JSON schema of this document.
   *
   * @format uri
   */
  $schema?: string;
  /**
   * URL where dataset was downloaded from.
   *
   * @format uri
   */
  url?: string;
  /**
   * URL to terms of use.
   *
   * @format uri
   */
  terms_of_use?: string;
}

export interface InputDocument<StateType, ProcessType> extends SelfReference {
  /**
   * @minLength 1
   */
  contributor: string;
  /**
   * @minLength 1
   */
  name: string;
  // cite: Reference; // Should only be in output.
  // Disabled this field as its use is currently unclear.
  // publication?: Reference; // Should this field instead hold a key into 'references'?
  description: string;
  // TODO for validation the keys should be unique and the values as well
  references: Dict<Reference>;
  // TODO for validation the keys should be unique and the values as well
  states: Dict<InState<StateType>>;
  /**
   * @minItems 1
   * @uniqueItems true
   */
  processes: Array<ProcessType>;
}
