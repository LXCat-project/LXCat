import { z } from "zod";
import { atom } from "../generators";
import {
  buildTerm,
  buildTwoTerm,
  ShellEntry,
  TotalAngularSpecifier,
} from "./common";
import { LSDescriptor, LSTermImpl } from "./ls";

const J1L2TermImpl = z.object({
  K: z.number().multipleOf(0.5).nonnegative(),
  S: z.number().multipleOf(0.5).nonnegative(),
  P: z.union([z.literal(-1), z.literal(1)]),
});
export const J1L2Term = J1L2TermImpl.merge(TotalAngularSpecifier);

export const AtomJ1L2Impl = buildTerm(
  z.array(ShellEntry),
  buildTwoTerm(LSDescriptor, buildTerm(z.array(ShellEntry), LSTermImpl)),
).transform((atom) => ({
  ...atom,
  summary: "J1L2",
  latex: "J1L2",
}));

export const AtomJ1L2 = atom("AtomJ1L2", AtomJ1L2Impl);
export type AtomJ1L2 = z.input<typeof AtomJ1L2>;
