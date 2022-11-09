import { describe, expect, test } from "vitest";

import { momentaMaxMin, momenta, momentaCouplings } from "./coupling";
import { momentaFromShell } from "./coupling";

// FIXME: try half-integer examples
describe("momenta from term", () => {
  test("Jmax Jmin", () => {
    let orbital = 2;
    let spin = 1;
    let [max, min] = momentaMaxMin(orbital, spin);
    expect(max + min).toEqual(2 * Math.max(orbital, spin));

    orbital = 1;
    spin = 2;
    [max, min] = momentaMaxMin(orbital, spin);
    expect(max + min).toEqual(2 * Math.max(orbital, spin));
  });

  test("all Js: Jman -> Jmin", () => {
    const orbital = 2;
    const spin = 1;
    expect(momenta(orbital, spin)).toHaveLength(
      2 * Math.min(orbital, spin) + 1
    );
  });

  test("couplings: all Js x spin", () => {
    const els: number[] = [2, 1, 0];
    const spin = 1;
    // FIXME: very example specific length test: spin = 1 => intermediate momenta overlap
    expect(momentaCouplings(els, spin)).toHaveLength(els.length + 1);

    // different non-overlapping sets of momenta
    let spins = [1, 1.5];
    expect(momentaCouplings(els, spins)).toHaveLength(els.length * 2 + 2);

    // overlapping sets of momenta, larger set is w/ spin 2
    spins = [1, 2];
    expect(momentaCouplings(els, spins)).toHaveLength(els.length + 2);
  });
});

describe("momenta from shell", () => {
  test("L and S", () => {
    const l = 1;
    const expected = [
      [1, 1, 0.5], // l = 1
      [2, 1, 1], // l = 1, 0
      [3, 0, 1.5], // l = 1, 0, -1
      [4, 1, 1], // l = 1, 0, 2x-1
      [5, 1, 0.5], // l = 1, 2x0, 2x-1
    ];
    for (const [occupance, L_exp, S_exp] of expected) {
      const [L, S] = momentaFromShell(l, occupance);
      expect(L).toEqual(L_exp);
      expect(S).toEqual(S_exp);
    }
  });
});
