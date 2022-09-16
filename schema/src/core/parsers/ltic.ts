import { MoleculeParser } from "../parse";
import { LinearTriatomInversionCenter } from "../molecules/triatom_linear_inversion_center";
import { linearInversionCenterElectronicParser } from "./linear_inversion_center_electronic";
import { linearTriatomVibrationalParser } from "./triatom_linear_vibrational";
import { rotationalParser } from "./rotational";

export const ltic_parser: MoleculeParser<LinearTriatomInversionCenter> = {
  // particle_type: ParticleType.Molecule,
  e: linearInversionCenterElectronicParser,
  v: linearTriatomVibrationalParser,
  r: rotationalParser,
};
