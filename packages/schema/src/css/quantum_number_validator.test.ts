import { beforeAll, describe, expect, test } from "vitest";

import { readFileSync } from "fs";

import { ErrorObject } from "ajv";

import { CouplingScheme } from "../core/atoms/coupling_scheme";
import { AnyAtom } from "../core/atoms";
import { InState } from "../core/state";
import { Dict } from "./quantum_number_validator";
import { get_states, get_errobj } from "./quantum_number_validator";
import { ValidateData } from "./quantum_number_validator";
import {
  check_quantum_numbers,
  check_states,
} from "./quantum_number_validator";

import { CrossSectionSetRaw } from "./input";
import { AnyMolecule } from "../core/molecules";

let inputs_ok: [string, InState<AnyAtom | AnyMolecule>][]; // FIXME: type w/o AnyMolecule not supported
let inputs_nok: [string, InState<AnyAtom | AnyMolecule>][];

function readExample(fn: string) {
  const content = readFileSync(fn, { encoding: "utf8" });
  const body = JSON.parse(content);
  return body;
}

beforeAll(() => {
  const data_ok = readExample("./data/Ar_C_P_Nobody_LXCat.json")
  const data_nok = readExample("./data/Ar_C_P_Nobody_LXCat_bad.json")
  inputs_ok = get_states(data_ok);
  inputs_nok = get_states(data_nok as CrossSectionSetRaw);
})

describe("validate parity data", () => {
  test("core & excited", () => {
    let err: ErrorObject;
    let validator: ValidateData;
    // NOTE: always returns true for: comp["type"] == "AtomLS"; element 0
    for (const [key, atom] of inputs_ok) {
      for (const [idx, comp] of atom.electronic!.entries()) {
        err = get_errobj(`${key}/electronic/${idx}`, comp);
        validator = new ValidateData(comp, err);
        const status: boolean = validator.parity();
        // console.log("Error: ", JSON.stringify(validator.err, null, 2));
        expect(status).toEqual(true);
      }
    }
  });

  test("core & excited w/ error", () => {
    let err: ErrorObject;
    let validator: ValidateData;
    const bad: Dict = {
      second: { 0: "excited" },
      third: { 1: "core" },
      carbon_p: { 0: "P" },
    };
    for (const [key, atom] of inputs_nok) {
      if (!bad.hasOwnProperty(key)) continue;
      for (const [idx, comp] of atom.electronic!.entries()) {
        if (!bad[key].hasOwnProperty(idx.toString())) continue;
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
  test("coupling - LS, LS1, J1L2", () => {
    // FIXME: add LS1 example
    let err: ErrorObject;
    let validator: ValidateData;
    let status: boolean;
    for (const [key, atom] of inputs_ok) {
      for (const [idx, comp] of atom.electronic!.entries()) {
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

  test("coupling - shell, LS, J1L2 w/ error", () => {
    let err: ErrorObject;
    let validator: ValidateData;
    const bad: Dict = {
      second: { 0: "core" },
      third: { 0: "J" },
      carbon: { 0: "S" }, // FIXME: also L, don't know how to test both
      phosphorus: { 0: "core" },
    };
    let status: boolean;
    for (const [key, atom] of inputs_nok) {
      if (!bad.hasOwnProperty(key)) continue;
      for (const [idx, comp] of atom.electronic!.entries()) {
        if (!bad[key].hasOwnProperty(idx.toString())) continue;
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

describe("dispatchers", () => {
  test("component w/ no errors", () => {
    for (const [key, atom] of inputs_ok) {
      for (const [idx, comp] of atom.electronic!.entries()) {
        const errors: ErrorObject[] = check_quantum_numbers(
          `${key}/electronic/${idx}`,
          comp,
          []
        );
        // console.log("Error: ", JSON.stringify(errors, null, 2));
        expect(errors).toHaveLength(0);
      }
    }
  });

  test("component w/ errors", () => {
    const bad: string[] = [
      "second",
      "third",
      "carbon",
      "carbon_p",
      "phosphorus",
    ];
    for (const [key, atom] of inputs_nok) {
      if (!bad.includes(key)) continue;
      for (const [idx, comp] of atom.electronic!.entries()) {
        const errors: ErrorObject[] = check_quantum_numbers(
          `${key}/electronic/${idx}`,
          comp,
          []
        );
        // console.log("Error: ", JSON.stringify(errors, null, 2));
        expect(errors).toHaveLength(1);
        // TODO: check error specifics
      }
    }
  });

  test("jsonobject.states w/ no errors", () => {
    const errors: ErrorObject[] = check_states(inputs_ok, []);
    // console.log("Error: ", JSON.stringify(errors, null, 2));
    expect(errors).toHaveLength(0);
  });

  test("jsonobject.states w/ errors", () => {
    const errors: ErrorObject[] = check_states(inputs_nok, []);
    // console.log("Error: ", JSON.stringify(errors, null, 2));
    expect(errors).toHaveLength(6); // FIXME: double check
    // TODO: check error specifics
  });
});
