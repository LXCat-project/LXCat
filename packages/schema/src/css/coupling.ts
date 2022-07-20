/**
 * Given two angular momenta, return the maximum & minimum
 *
 * @param {number} orbital - typically the orbital angular momentum, but
 *                           it can be any kind of angular momentum
 *
 * @param {number} spin - spin angular momentum, but as `orbital`, it can
 *                        be any kind of angular momentum
 *
 * @return {number[]} [maximum, minimum] angular momentum
 */
export function momenta_max_min(orbital: number, spin: number) {
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
export function momenta(orbital: number, spin: number) {
    const [jmax, jmin] = momenta_max_min(orbital, spin);
    return Array(jmax - jmin + 1).fill(0).map((_, idx) => jmax - idx);
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
export function momenta_couplings(els: number[], spin: number | number[]) {
    let spins: number[];
    if (spin.length == undefined) {
        spins = [spin];
    } else {
        spins = spin;
    }
    return Array.from(new Set(spins.flatMap(
        (_spin: number) => Array.from(new Set(els.flatMap(
            (el: number) => momenta(el, _spin)
        )))
    )));
}


export function check_momenta(orbital: number, spin: number, expected_J: number) {
    let jays: number[] = momenta(orbital, spin);
    return {
        result: jays.includes(expected_J),
        allowed: jays
    };
}


export function check_couplings(L1: number, L2: number, S1: number, expected_K: number) {
    // NOTE: all possible total angular momenta: jmax, jmax-1, ..., jmin
    let ls1s: number[] = momenta_couplings(momenta(L1, L2), S1);
    return {
        result: ls1s.includes(expected_K),
        allowed: ls1s
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
export function momenta_from_shell(orbital: number, occupance: number) {
    let L: number = 0;
    let S: number = 0;
    const els = Array(orbital * 2 + 1).fill(0).map((_, idx) => orbital - idx);
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
