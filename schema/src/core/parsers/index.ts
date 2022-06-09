import { ParseAtom, ParseMolecule } from "../parse";
import { AnyAtom } from "../atoms";
import { ParticleType } from "../enumeration";
import { AtomicGenerator, MolecularGenerator } from "../generators";
import { AnyMolecule } from "../molecules";
import { hd_parser } from "./hd";
import { ht_parser } from "./ht";
import { j1l2_parser } from "./j1l2";
import { ls_parser } from "./ls";
import { ls1_parser } from "./ls1";
import { ltic_parser } from "./ltic";

type AtomParserDict<T extends AtomicGenerator<unknown, string>> = {
  [key in T["type"]]: ParseAtom<T>;
};
type MoleculeParserDict<
  T extends MolecularGenerator<unknown, unknown, unknown, string>
> = {
  [key in T["type"]]: ParseMolecule<T>;
};

export type StateParserDict<
  A extends AtomicGenerator<unknown, string>,
  M extends MolecularGenerator<unknown, unknown, unknown, string>
> = AtomParserDict<A> & MoleculeParserDict<M>;

export type ParticleTypeDict<
  T extends
    | AtomicGenerator<unknown, string>
    | MolecularGenerator<unknown, unknown, unknown, string>
> = {
  [key in T["type"]]: ParticleType;
};

// TODO: Should this be split in two separate dicts? Might be easier to handle
// and is possible as checking whether a type is molecular now happens through
// get_particle_type. The main parsing function can then be split up, which
// then mitigates the need for the horrendous "function overloading"
// capabilities of Type/JavaScript.
export const parsers: StateParserDict<AnyAtom, AnyMolecule> = {
  AtomLS: ls_parser,
  AtomLS1: ls1_parser,
  AtomJ1L2: j1l2_parser,
  HomonuclearDiatom: hd_parser,
  HeteronuclearDiatom: ht_parser,
  LinearTriatomInversionCenter: ltic_parser,
};

// TODO: I don't like that this is defined separately, perhaps the former
// approach was better (add the particle type as a property). However, this
// might make it inconvenient to split the parser map in two, as it is then not
// initially known if the type is related to an atom or a molecule (this has to
// be checked at runtime to evaluate which parsing path to invoke).
export const get_particle_type: ParticleTypeDict<AnyAtom | AnyMolecule> = {
  AtomLS: ParticleType.Atom,
  AtomLS1: ParticleType.Atom,
  AtomJ1L2: ParticleType.Atom,
  HomonuclearDiatom: ParticleType.Molecule,
  HeteronuclearDiatom: ParticleType.Molecule,
  LinearTriatomInversionCenter: ParticleType.Molecule,
};
