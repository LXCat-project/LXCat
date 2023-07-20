import { z } from "zod";
import { molecule } from "../generators";
import { LinearElectronicImpl } from "./components/electronic/linear";
import { RotationalImpl } from "./components/rotational";
import { DiatomicVibrationalImpl } from "./components/vibrational/diatomic";

export const HeteronuclearDiatom = molecule(
  "HeteronuclearDiatom",
  LinearElectronicImpl,
  DiatomicVibrationalImpl,
  RotationalImpl,
);
export type HeteronuclearDiatom = z.input<typeof HeteronuclearDiatom>;
