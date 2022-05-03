import { Pair } from "./util";
import { Storage } from "./enumeration";

/**
 * Lookup table type: an array of number pairs.
 */
 export interface LUT {
    type: Storage.LUT;
    labels: Pair<string>;
    units: Pair<string>;
    data: Array<Pair<number>>;
  }