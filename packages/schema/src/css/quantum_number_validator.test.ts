import { beforeAll, describe, expect, test } from "vitest";

import { readFileSync } from "fs";

import { ErrorObject } from "ajv";

import { CouplingScheme } from "../core/atoms/coupling_scheme";
import { AnyAtom } from "../core/atoms";
import { InState } from "../core/state";
import { Dict } from "./common";
import { get_states, get_errobj } from "./quantum_number_validator";
import { check_parity, check_LS, check_LS1, check_J1L2 } from "./quantum_number_validator";
import {
  check_quantum_numbers,
  check_states,
} from "./quantum_number_validator";

import { AnyMolecule } from "../core/molecules";

let inputs_ok: [string, InState<AnyAtom | AnyMolecule>][]; // FIXME: type w/o AnyMolecule not supported
let inputs_parity_nok: [string, InState<AnyAtom | AnyMolecule>][];
let inputs_momenta_nok: [string, InState<AnyAtom | AnyMolecule>][];

function readExample(fn: string) {
  const content = readFileSync(fn, { encoding: "utf8" });
  const body = JSON.parse(content);
  return body;
}

function not_empty(bad: Dict) {
  return (Object.keys(bad).length !== 0);
}

beforeAll(() => {
  const data_ok = readExample("src/css/data/Ar_C_P_Nobody_LXCat.json");
  const data_parity_nok = readExample("src/css/data/Ar_C_P_Nobody_LXCat_bad_parity.json");
  const data_momenta_nok = readExample("src/css/data/Ar_C_P_Nobody_LXCat_bad_momenta.json");
  inputs_ok = get_states(data_ok);
  inputs_parity_nok = get_states(data_parity_nok);
  inputs_momenta_nok = get_states(data_momenta_nok);
});

describe("validate parity data", () => {
  test("core & excited", () => {
    let errors: ErrorObject[] = [];
    for (const [key, atom] of inputs_ok) {
      for (const [idx, comp] of atom.electronic!.entries()) {
        const status: boolean = check_parity(`${key}/electronic/${idx}`, comp, errors);
        expect(status).toEqual(true);
      }
    }
    expect(errors.length).toEqual(0);
  });

  test("core & excited w/ errors", () => {
    let errors: ErrorObject[] = [];
    const bad: Dict = {
      second: { 0: "excited" },
      third: { 1: "core" },
      carbon: { 0: "P" },
    };
    for (const [key, atom] of inputs_parity_nok) {
      for (const [idx, comp] of atom.electronic!.entries()) {
        const status: boolean = check_parity(`${key}/electronic/${idx}`, comp, errors);
        if (bad.hasOwnProperty(key) && bad[key].hasOwnProperty(idx.toString())) {
          const err = errors[errors.length - 1];
          expect(status).toEqual(false);
          expect(err.instancePath).toContain(`${key}/electronic/${idx}`);
          // expect(err.params.scheme).toEqual(comp.scheme);  // fails on multipart
          expect(err.params.allowed.P).toBeDefined();
          expect(err.message).toContain("parity");
        } else {
          expect(status).toEqual(true);
        }
      }
    }
    // console.log("Error: ", JSON.stringify(errors, null, 2));
    // one of the errors is in the shell config, so propagates to overall
    expect(errors.length).toEqual(4);
  });
});

describe("validate angular momenta", () => {
  test("coupling - LS, LS1, J1L2", () => {
    // FIXME: add LS1 example
    let errors: ErrorObject[] = [];
    let status: boolean;
    for (const [key, atom] of inputs_ok) {
      for (const [idx, comp] of atom.electronic!.entries()) {
        let parent: string = `${key}/electronic/${idx}`;
        switch (comp.scheme) {
          case CouplingScheme.LS:
            status = check_LS(parent, comp, errors);
            break;
          case CouplingScheme.LS1:
            status = check_LS1(parent, comp, errors);
            break;
          case CouplingScheme.J1L2:
            status = check_J1L2(parent, comp, errors);
            break;
          default:
            status = false; // why am I here!?
        }
        expect(status).toEqual(true);
      }
    }
    // console.log("Error: ", JSON.stringify(errors, null, 2));
    expect(errors.length).toEqual(0);
  });

  test("coupling - shell, LS, J1L2 w/ error", () => {
    let errors: ErrorObject[] = [];
    const bad: Dict = {
      second: { 0: "core" },
      third: { 0: "J", 1: "K" },
      phosphorus: { 0: "core" },
    };
    let status: boolean;
    for (const [key, atom] of inputs_momenta_nok) {
      for (const [idx, comp] of atom.electronic!.entries()) {
        let parent: string = `${key}/electronic/${idx}`;
        switch (comp.scheme) {
          case CouplingScheme.LS:
            status = check_LS(parent, comp, errors);
            break;
          case CouplingScheme.LS1:
            status = check_LS1(parent, comp, errors);
            break;
          case CouplingScheme.J1L2:
            status = check_J1L2(parent, comp, errors);
            break;
          default:
            status = false; // why am I here!?
        }
        if (bad.hasOwnProperty(key) && bad[key].hasOwnProperty(idx.toString())) {
          const err = errors[errors.length - 1];
          expect(status).toEqual(false);
          expect(err.instancePath).toContain(`${key}/electronic/${idx}`);
          // expect(err.params.scheme).toEqual(comp.scheme);  // fails on multipart
          // expect(err.params.allowed.P).toBeDefined();
          // expect(err.message).toContain("parity");
        } else {
          expect(status).toEqual(true);
        }
      }
    }
    // console.log("Error: ", JSON.stringify(errors, null, 2));
    expect(errors.length).toEqual(7);
  });
});

describe("dispatchers", () => {
  test("component w/ no errors", () => {
    for (const [key, atom] of inputs_ok) {
      for (const [idx, comp] of atom.electronic!.entries()) {
        let errors: ErrorObject[] = [];
        const status = check_quantum_numbers(`${key}/electronic/${idx}`, comp, errors);
        // console.log("Error: ", JSON.stringify(errors, null, 2));
        expect(errors).toHaveLength(0);
      }
    }
  });

  test("component w/ errors", () => {
    const bad: Dict = {
      second: { 0: "excited" },
      third: { 1: "core" },
      carbon: { 0: "P" },
    };
    let errors: ErrorObject[] = [];
    for (const [key, atom] of inputs_parity_nok) {
      for (const [idx, comp] of atom.electronic!.entries()) {
        const status = check_quantum_numbers(`${key}/electronic/${idx}`, comp, errors);
        if (bad.hasOwnProperty(key) && bad[key].hasOwnProperty(idx.toString())) {
          expect(status).toEqual(false);
        } else {
          expect(status).toEqual(true);
        }
      }
    }
    expect(check_quantum_numbers("foo", { scheme: "not-defined" }, errors)).toEqual(false);
    expect(errors).toHaveLength(5);
  });

  test("jsonobject.states w/ no errors", () => {
    const errors: ErrorObject[] = check_states(inputs_ok, []);
    expect(errors).toHaveLength(0);
  });

  test("jsonobject.states w/ errors", () => {
    const errors: ErrorObject[] = check_states(inputs_momenta_nok, []);
    expect(errors).toHaveLength(7);
    // expect(errors).toEqual();
  });
});
