/**
 * Given the orbital angular momentum, and shell occupance, calculate parity
 *
 * @param {number} orbital - orbital angular momentum
 *
 * @param {number} occupance - occupancy of the orbital
 *
 * @return {number} parity
 */
export function parity(orbital: number, occupance: number) {
    return (-1) ** (orbital * occupance);
}


/**
 * Combine various parity terms
 *
 * @param {number[]} parities - array of parities
 *
 * @return {number} parity
 */
export function combine_parity(parities: number[]) {
    return parities.reduce((prev, next) => prev * next, 1);
}
