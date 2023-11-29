import { literal, tuple } from "zod";
import { Element } from "../element";

export const HomonuclearCompositionDescriptor = tuple([
  tuple([Element, literal(2)]),
]);
