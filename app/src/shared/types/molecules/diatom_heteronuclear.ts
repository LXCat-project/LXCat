import { MolecularDBGenerator, MolecularGenerator } from "../generators";
import { LinearElectronicImpl } from "./components/electronic/linear";
import { RotationalImpl } from "./components/rotational";
import { DiatomicVibrationalImpl } from "./components/vibrational/diatomic";

export type HeteronuclearDiatom = MolecularGenerator<
  LinearElectronicImpl,
  DiatomicVibrationalImpl,
  RotationalImpl,
  "HeteronuclearDiatom"
>;

export type HeteronuclearDiatom_DB = MolecularDBGenerator<
  LinearElectronicImpl,
  DiatomicVibrationalImpl,
  RotationalImpl,
  "HeteronuclearDiatom"
>;
