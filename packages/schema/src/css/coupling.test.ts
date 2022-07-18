import { describe, expect, test } from "vitest";

import { momenta_max_min, momenta, momenta_couplings } from "./coupling";

// FIXME: try half-integer examples
describe("momenta", () => {
    test("Jmax Jmin", () => {
        var orbital = 2;
        var spin = 1;
        var [max, min] = momenta_max_min(orbital, spin);
        expect(max + min).toEqual(2 * Math.max(orbital, spin));

        orbital = 1;
        spin = 2;
        [max, min] = momenta_max_min(orbital, spin);
        expect(max + min).toEqual(2 * Math.max(orbital, spin));
    });

    test("all Js: Jman -> Jmin", () => {
        var orbital = 2;
        var spin = 1;
        expect(momenta(orbital, spin)).toHaveLength(2 * Math.min(orbital, spin) + 1);
    });

    test("couplings: all Js x spin", () => {
        const els: number[] = [2, 1, 0];
        const spin = 1;
        // FIXME: very example specific length test: spin = 1 => intermediate momenta overlap
        expect(momenta_couplings(els, spin)).toHaveLength(els.length + 1);

	// different non-overlapping sets of momenta
        var spins = [1, 1.5];
        expect(momenta_couplings(els, spins)).toHaveLength(els.length * 2 + 2);

	// overlapping sets of momenta, larger set is w/ spin 2
        spins = [1, 2];
        expect(momenta_couplings(els, spins)).toHaveLength(els.length + 2);
    });
});
