import { ParseMolecule } from "../parse";
import { HomonuclearDiatom } from "../molecules/diatom_homonuclear";
import { linearInversionCenterElectronicParser } from "./linear_inversion_center_electronic";
import { diatomicVibrationalParser } from "./diatomic_vibrational";
import { rotationalParser } from "./rotational";

export const hd_parser: ParseMolecule<HomonuclearDiatom> = {
  // particle_type: ParticleType.Molecule,
  e: linearInversionCenterElectronicParser,
  v: diatomicVibrationalParser,
  r: rotationalParser,
};
