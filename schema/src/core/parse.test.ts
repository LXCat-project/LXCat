import { describe, expect, it } from "vitest";
import { parse_charge } from "./parse";

describe('parse_charge()', () => {
    const testCases: Array<[number, string]> = [
        [0, ''],
        [1, '^+'],
        [-1, '^-'],
        [2, '^2+'],
        [-2, '^2-'],
    ]
    it.each(testCases)('given %d should render %s', (input, expected) => {
        const result = parse_charge(input)
        expect(result).toEqual(expected);
    })
})