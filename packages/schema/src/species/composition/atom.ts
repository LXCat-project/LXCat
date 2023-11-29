import { literal, tuple, TypeOf } from "zod";
import { Element } from "./element";

export const AtomComposition = tuple([tuple([Element, literal(1)])]);
export type AtomComposition = TypeOf<typeof AtomComposition>;
