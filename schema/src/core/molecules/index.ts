import { XORChain, ToUnion } from "../util";
import { HeteronuclearDiatom } from "./diatom_heteronuclear";
import { HomonuclearDiatom } from "./diatom_homonuclear";
import { LinearTriatomInversionCenter } from "./triatom_linear_inversion_center";

export type MoleculeList = [
  HeteronuclearDiatom,
  HomonuclearDiatom,
  LinearTriatomInversionCenter
];
export type AnyMolecule = XORChain<MoleculeList>;
export type AnyMoleculeJSON = ToUnion<MoleculeList>;
