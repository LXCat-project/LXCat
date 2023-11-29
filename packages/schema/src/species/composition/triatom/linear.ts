import { array, literal, tuple, union } from "zod";
import { Element } from "../element.js";

// TODO: Add extra checks to determine whether `LTICComposition` should be used.
export const LinearTriatomComposition = union([
  array(tuple([Element, literal(1)])).min(3).max(3),
  tuple([tuple([Element, literal(1)]), tuple([Element, literal(2)])]),
  tuple([tuple([Element, literal(2)]), tuple([Element, literal(1)])]),
  // NOTE: Always has an inversion center.
  // tuple([tuple([Element, literal(3)])]),
]);
