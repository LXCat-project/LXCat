// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { AnyAtom } from "../atoms";
import { ParticleType } from "../enumeration";
import { AnyMolecule } from "../molecules";
import { AtomParser, MoleculeParser } from "../parse";
import { hd_parser } from "./hd";
import { ht_parser } from "./ht";
import { j1l2_parser } from "./j1l2";
import { ls_parser } from "./ls";
import { ls1_parser } from "./ls1";
import { ltic_parser } from "./ltic";

export type AtomParserDict<T extends AnyAtom> = {
  [key in T["type"]]: AtomParser<T>;
};
export type MoleculeParserDict<T extends AnyMolecule> = {
  [key in T["type"]]: MoleculeParser<T>;
};

export type StateParserDict<A extends AnyAtom, M extends AnyMolecule> =
  & AtomParserDict<A>
  & MoleculeParserDict<M>;

export type ParticleTypeDict<T extends AnyAtom | AnyMolecule> = {
  [key in T["type"]]: ParticleType;
};

// TODO: Should this be split in two separate dicts? Might be easier to handle
// and is possible as checking whether a type is molecular now happens through
// get_particle_type. The main parsing function can then be split up, which
// then mitigates the need for the horrendous "function overloading"
// capabilities of Type/JavaScript.
// export const parsers: StateParserDict<AnyAtom, AnyMolecule> = {
//   AtomLS: ls_parser,
//   AtomLS1: ls1_parser,
//   AtomJ1L2: j1l2_parser,
//   HomonuclearDiatom: hd_parser,
//   HeteronuclearDiatom: ht_parser,
//   LinearTriatomInversionCenter: ltic_parser,
// };
export const atomParsers: AtomParserDict<AnyAtom> = {
  AtomLS: ls_parser,
  AtomLS1: ls1_parser,
  AtomJ1L2: j1l2_parser,
};

export const moleculeParsers: MoleculeParserDict<AnyMolecule> = {
  HomonuclearDiatom: hd_parser,
  HeteronuclearDiatom: ht_parser,
  LinearTriatomInversionCenter: ltic_parser,
};

export const parsers: StateParserDict<AnyAtom, AnyMolecule> = {
  ...atomParsers,
  ...moleculeParsers,
};
