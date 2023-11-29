import { literal, tuple } from "zod";
import { Element } from "../element.js";

export const HomonuclearCompositionDescriptor = tuple([
  tuple([Element, literal(2)]),
]);
