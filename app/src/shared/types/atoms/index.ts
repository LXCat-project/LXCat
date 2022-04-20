// DONE: Move the coupling scheme into ConfigTerm.
// DONE: LS coupling sometimes also requires intermediate term symbols (see
// e.g. excited states of N on NIST).  -> This does not seem to be the case, as
// an electron configuration + LSTerm will already be unique.

import { ToUnion, XORChain } from "../util";
import { AtomJ1L2 } from "./j1l2";
import { AtomLS } from "./ls";
import { AtomLS1 } from "./ls1";

// DONE: Optionally split the CouplingScheme enum and the general interfaces
// into separate modules.
// FIXME: LS coupled states should either have 0 entries or >=2 (one entry for
// shell that provides the electron and one entry for the receiving shell).

export type AtomList = [AtomLS, AtomJ1L2, AtomLS1];

export type AnyAtom = XORChain<AtomList>;
export type AnyAtomJSON = ToUnion<AtomList>;