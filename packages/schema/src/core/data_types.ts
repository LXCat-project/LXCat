// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { Storage } from "./enumeration";
import { Pair } from "./util";

/**
 * @minLength 1
 */
type FilledString = string;

/**
 * Lookup table type: an array of number pairs.
 */
export type LUT = {
  type: Storage.LUT;
  labels: Pair<FilledString>;
  units: Pair<FilledString>;
  /**
   * @minItems 1
   */
  values: Array<Pair<number>>;
};
