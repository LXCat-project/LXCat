import { ParseMolecule } from "../parse";
import { HeteronuclearDiatom } from "../molecules/diatom_heteronuclear";
import { linearElectronicParser } from "./linear_electronic";
import { diatomicVibrationalParser } from "./diatomic_vibrational";
import { rotationalParser } from "./rotational";

export const ht_parser: ParseMolecule<HeteronuclearDiatom> = {
  // particle_type: ParticleType.Molecule,
  e: linearElectronicParser,
  v: diatomicVibrationalParser,
  r: rotationalParser,
};
