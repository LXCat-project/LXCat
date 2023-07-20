import { z } from "zod";
import { MolecularParity } from "../common";
import { LinearElectronicImpl } from "./linear";

export const LinearInversionCenterElectronicImpl = z.intersection(
  LinearElectronicImpl,
  MolecularParity,
);
