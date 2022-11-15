// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { ShellEntry } from "../core/shell_entry";
import { Dict } from "./common";

/**
 * Given two angular momenta, return the maximum & minimum
 *
 * @param {number} orbital - typically the orbital angular momentum, but
 *                           it can be any kind of angular momentum
 *
 * @param {number} spin - spin angular momentum, but as `orbital`, it can
 *                        be any kind of angular momentum
 *
 * @return {[number, number]} [maximum, minimum] angular momentum
 */
export function momentaMaxMin(orbital: number, spin: number): [number, number] {
  return [orbital + spin, Math.abs(orbital - spin)];
}

// API 1: (number, number) -> number[]
/**
 * Given two angular momenta, calculate all possible values of total
 * angular momentum
 *
 * @param {number} orbital - typically the orbital angular momentum, but
 *                           it can be any kind of angular momentum
 *
 * @param {number} spin - spin angular momentum, same as `orbital`, it can
 *                        be any kind of angular momentum
 *
 * @return {number[]} Array of all possible values of angular momenta:
 *                    [max, max-1, max-2, ..., min]
 */
export function momenta(orbital: number, spin: number): number[] {
  const [jmax, jmin] = momentaMaxMin(orbital, spin);
  return Array(jmax - jmin + 1)
    .fill(0)
    .map((_, idx) => jmax - idx);
}

// API 2/3: (number[], number|number[]) -> number[]
/**
 * Given two sets of angular momenta, calculate all possible values of
 * total angular momentum (couplings)
 *
 * @param {number[]} orbital - set of orbital angular momentum, but it
 *                             can be any kind of angular momentum
 *
 * @param {number|number[]} spin - single/set of spin angular momenta, but
 *                                 it can be any kind of angular momentum
 *
 * @return {number[]} Array of all possible values of angular momenta:
 *                    [max, max-1, max-2, ..., min]
 */
export function momentaCouplings(
  els: number[],
  spin: number | number[]
): number[] {
  let spins: number[];
  if (typeof spin === "number") {
    spins = [spin];
  } else {
    spins = spin;
  }
  return Array.from(
    new Set(
      spins.flatMap((_spin: number) =>
        Array.from(new Set(els.flatMap((el: number) => momenta(el, _spin))))
      )
    )
  );
}

export function checkMomenta(
  orbital: number,
  spin: number,
  expected_J: number
) {
  const jays: number[] = momenta(orbital, spin);
  return {
    result: jays.includes(expected_J),
    allowed: jays,
  };
}

export function checkCouplings(
  L1: number,
  L2: number,
  S1: number,
  expected_K: number
) {
  // NOTE: all possible total angular momenta: jmax, jmax-1, ..., jmin
  const ls1s: number[] = momentaCouplings(momenta(L1, L2), S1);
  return {
    result: ls1s.includes(expected_K),
    allowed: ls1s,
  };
}

/**
 * For a given shell angular momenta and occupancy, calculate the
 * maximum total orbital and spin angular momentum.
 *
 * @param {number} orbital - orbital angular momentum
 *
 * @param {number} occupance - shell occupancy
 *
 * @return {[number, number]} Array of L & S
 */
export function momentaFromShell(
  orbital: number,
  occupance: number
): [number, number] {
  let L = 0;
  let S = 0;
  const els = Array(orbital * 2 + 1)
    .fill(0)
    .map((_, idx) => orbital - idx);
  let unpaired: number;
  if (occupance > els.length) {
    unpaired = 4 * orbital + 2 - occupance;
  } else {
    unpaired = occupance;
  }
  S += Math.abs(unpaired * 0.5);
  L += els.slice(0, unpaired).reduce((i, res) => Math.abs(i + res));
  return [L, S];
}

export function checkMomentaFromShell(
  entries: ShellEntry[],
  L_expected: number,
  S_expected: number
) {
  let L = 0;
  let S = 0;

  for (const entry of entries) {
    // l_max = n - 1; num of l = 2*l + 1; max occupancy = 2* num of l
    if (entry.l >= entry.n || entry.occupance > 4 * entry.l + 2) {
      return {
        result: false,
        allowed: {},
      };
    }
    const [_L, _S] = momentaFromShell(entry.l, entry.occupance);
    S += _S;
    L += _L;
  }

  const allowed: Dict = { L: L, S: S };
  return { result: L === L_expected && S === S_expected, allowed };
}
