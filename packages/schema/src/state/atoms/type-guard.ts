import { AnySpecies } from "../species";
import { AnyAtom } from "./any-atom";

export const isAtom = (state: AnySpecies): state is AnyAtom =>
  AnyAtom.options.some((option) => option.shape.type.value === state.type);
