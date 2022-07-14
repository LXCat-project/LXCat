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


/**
 * Given two angular momenta, calculate all possible values of total
 * angular momentum
 *
 * @param {number} orbital - typically the orbital angular momentum, but
 *                           it can be any kind of angular momentum
 *
 * @param {number} spin - spin angular momentum, but as `orbital`, it can
 *                        be any kind of angular momentum
 *
 * @return {number[]} Array of all possible values of angular momenta:
 *                    [max, max-1, max-2, ..., min]
 */
export function momenta(orbital: number, spin: number) {
    const [jmax, jmin] = momenta_max_min(orbital, spin);
    return Array(jmax - jmin + 1).fill(0).map((_, idx) => jmax - idx);
}


export function momenta_couplings(els: number[], spin: number) {
    return Array.from(new Set(els.flatMap((el: number) => momenta(el, spin))));
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


// TODO: (number[], number[]) -> number[]
