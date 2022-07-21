import { describe, expect, test } from "vitest";

import { ErrorObject } from "ajv";

import { CouplingScheme } from "../core/atoms/coupling_scheme";
import { AnyAtom } from "../core/atoms";
import { Dict } from "./quantum_number_validator";
import { get_states, get_errobj } from "./quantum_number_validator";
import { ValidateData } from "./quantum_number_validator";

// atom
import data_ok from "./data/Ar_C_P_Nobody_LXCat.json";
import data_nok from "./data/Ar_C_P_Nobody_LXCat_bad.json";

const inputs_ok: [string, AnyAtom][] = get_states(data_ok);
const inputs_nok: [string, AnyAtom][] = get_states(data_nok);

describe("validate parity data", () => {
    test("core & excited", () => {
        var err: ErrorObject;
        let validator: ValidateData;
        // NOTE: always returns true for: comp["type"] == "AtomLS"; element 0
        for (let [key, atom] of inputs_ok) {
            for (let [idx, comp] of atom.electronic.entries()) {
                err = get_errobj(`${key}/electronic/${idx}`, comp);
                validator = new ValidateData(comp, err);
                const status: boolean = validator.parity();
                // console.log("Error: ", JSON.stringify(validator.err, null, 2));
                expect(status).toEqual(true);
            }
        }
    });

    test("core & excited w/ error", () => {
        var err: ErrorObject;
        let validator: ValidateData;
        const bad: Dict = {
            "second": { 0: "excited" },
            "third": { 1: "core" },
	    "carbon": { 0: "P" }
        };
        for (let [key, atom] of inputs_nok) {
            if (!(bad.hasOwnProperty(key))) continue;
            for (let [idx, comp] of atom.electronic.entries()) {
                if (!(bad[key].hasOwnProperty(idx.toString()))) continue;
                err = get_errobj(`${key}/electronic/${idx}`, comp);
                validator = new ValidateData(comp, err);
                const status: boolean = validator.parity();
                // console.log("Error: ", JSON.stringify(validator.err, null, 2));
                expect(status).toEqual(false);
                expect(err.instancePath).toEqual(`${key}/electronic/${idx}`);
                expect(err.params.scheme).toEqual(comp.scheme);
                expect(err.params.allowed[bad[key][idx.toString()]]).toBeDefined();
                expect(err.message).toContain(bad[key][idx.toString()]);
            }
        }
    });
});

describe("validate angular momenta", () => {
    test("coupling - LS, LS1, J1L2", () => { // FIXME: add LS1 example
        var err: ErrorObject;
        let validator: ValidateData;
        let status: boolean;
        for (let [key, atom] of inputs_ok) {
            for (let [idx, comp] of atom.electronic.entries()) {
                err = get_errobj(`${key}/electronic/${idx}`, comp);
                validator = new ValidateData(comp, err);
                switch (comp.scheme) {
                    case CouplingScheme.LS:
                        status = validator.LS();
                        break;
                    case CouplingScheme.LS1:
                        status = validator.LS1();
                        break;
                    case CouplingScheme.J1L2:
                        status = validator.J1L2();
                        break;
                    default:
                        status = false; // why am I here!?
                }
                // console.log("Error: ", JSON.stringify(validator.err, null, 2));
                expect(status).toEqual(true);
            }
        }
    });

    test("coupling - J1L2 w/ error", () => {
        var err: ErrorObject;
        let validator: ValidateData;
        const bad: Dict = {
            "second": { 0: "core" },
            "third": { 0: "J" }
        };
        let status: boolean;
        for (let [key, atom] of inputs_nok) {
            if (!(bad.hasOwnProperty(key))) continue;
            for (let [idx, comp] of atom.electronic.entries()) {
                if (!(bad[key].hasOwnProperty(idx.toString()))) continue;
                err = get_errobj(`${key}/electronic/${idx}`, comp);
                validator = new ValidateData(comp, err);
                switch (comp.scheme) {
                    case CouplingScheme.LS:
                        status = validator.LS();
                        break;
                    case CouplingScheme.LS1:
                        status = validator.LS1();
                        break;
                    case CouplingScheme.J1L2:
                        status = validator.J1L2();
                        break;
                    default:
                        status = false; // why am I here!?
                }
                // console.log("Error: ", JSON.stringify(validator.err, null, 2));
                expect(status).toEqual(false);
                expect(err.instancePath).toEqual(`${key}/electronic/${idx}`);
                expect(err.params.scheme).toEqual(comp.scheme);
                expect(err.params.allowed[bad[key][idx.toString()]]).toBeDefined();
                expect(err.message).toContain(bad[key][idx.toString()]);
            }
        }
    });
});
