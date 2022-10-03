import { Pair } from "./util";
import { Storage } from "./enumeration";

/**
 * @minLength 1
 */
type FilledString = string;

/**
 * Lookup table type: an array of number pairs.
 */
export interface LUT {
  type: Storage.LUT;
  labels: Pair<FilledString>;
  units: Pair<FilledString>;
  /**
   * @minItems 1
   */
  data: Array<Pair<number>>;
}
