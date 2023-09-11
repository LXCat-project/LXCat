// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { beforeAll, describe, expect, test } from "vitest";

import { readFileSync } from "fs";

import { ErrorObject } from "ajv";

import { AnyAtom } from "../core/atoms";
import { CouplingScheme } from "../core/atoms/coupling_scheme";
import { State } from "../core/state";
import { Dict } from "./common";
import {
  checkJ1L2,
  checkLS,
  checkLS1,
  checkParity,
  getStates,
} from "./quantum_number_validator";

import { AnyParticle } from "../core/particle";
import { checkQuantumNumbers, checkStates } from "./quantum_number_validator";

type Flatten<Type> = Type extends Array<infer Element> ? Element : Type;

let inputs_ok: [string, State<AnyAtom | AnyParticle>][];
let inputs_parity_nok: [string, State<AnyAtom | AnyParticle>][];
let inputs_momenta_nok: [string, State<AnyAtom | AnyParticle>][];

function readExample(fn: string) {
  const content = readFileSync(fn, { encoding: "utf8" });
  const body = JSON.parse(content);
  return body;
}

beforeAll(() => {
  const data_ok = readExample("src/css/data/Ar_C_P_Nobody_LXCat.json");
  const data_parity_nok = readExample(
    "src/css/data/Ar_C_P_Nobody_LXCat_bad_parity.json",
  );
  const data_momenta_nok = readExample(
    "src/css/data/Ar_C_P_Nobody_LXCat_bad_momenta.json",
  );
  inputs_ok = getStates(data_ok);
  inputs_parity_nok = getStates(data_parity_nok);
  inputs_momenta_nok = getStates(data_momenta_nok);
});

describe("validate parity data", () => {
  test("core & excited", () => {
    const errors: ErrorObject[] = [];
    for (const [key, atom] of inputs_ok) {
      if (atom.type === "simple") continue;
      if (Array.isArray(atom.electronic)) {
        for (const [idx, comp] of atom.electronic.entries()) {
          const status: boolean = checkParity(
            `${key}/electronic/${idx}`,
            comp,
            errors,
          );
          expect(status).toEqual(true);
        }
      } else {
        const status: boolean = checkParity(
          `${key}/electronic`,
          atom.electronic,
          errors,
        );
        expect(status).toEqual(true);
      }
    }
    expect(errors.length).toEqual(0);
  });

  test("core & excited w/ errors", () => {
    const errors: ErrorObject[] = [];
    const bad: Dict = {
      second: { 0: "excited" },
      third: { 1: "core" },
      carbon: { 0: "P" },
    };
    const parityCheck = (
      path: string,
      key: string,
      comp: Flatten<AnyAtom["electronic"]>,
    ) => {
      const status: boolean = checkParity(
        path,
        comp,
        errors,
      );
      if (key in bad) {
        const err = errors[errors.length - 1];
        expect(status).toEqual(false);
        expect(err.instancePath).toContain(path);
        // expect(err.params.scheme).toEqual(comp.scheme);  // fails on multipart
        expect(err.params.allowed.P).toBeDefined();
        expect(err.message).toContain("parity");
      } else {
        expect(status).toEqual(true);
      }
    };
    for (const [key, atom] of inputs_parity_nok) {
      if (atom.type === "simple") continue;
      if (Array.isArray(atom.electronic)) {
        for (const [idx, comp] of atom.electronic.entries()) {
          parityCheck(`${key}/electronic/${idx}`, key, comp);
        }
      } else {
        parityCheck(`${key}/electronic`, key, atom.electronic);
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
    const errors: ErrorObject[] = [];
    let status: boolean;

    const check = (path: string, comp: Flatten<AnyAtom["electronic"]>) => {
      const parent = path;
      switch (comp.scheme) {
        case CouplingScheme.LS:
          status = checkLS(parent, comp, errors);
          break;
        case CouplingScheme.LS1:
          status = checkLS1(parent, comp, errors);
          break;
        case CouplingScheme.J1L2:
          status = checkJ1L2(parent, comp, errors);
          break;
        default:
          status = false; // why am I here!?
      }
      expect(status).toEqual(true);
    };

    for (const [key, atom] of inputs_ok) {
      if (atom.type === "simple") continue;
      if (Array.isArray(atom.electronic)) {
        for (const [idx, comp] of atom.electronic.entries()) {
          check(`${key}/electronic/${idx}`, comp);
        }
      } else {
        check(`${key}/electronic`, atom.electronic);
      }
    }
    // console.log("Error: ", JSON.stringify(errors, null, 2));
    expect(errors.length).toEqual(0);
  });

  test("coupling - shell, LS, J1L2 w/ error", () => {
    const errors: ErrorObject[] = [];
    const bad: Dict = {
      second: { 0: "core" },
      third: { 0: "J", 1: "K" },
      phosphorus: { 0: "core" },
    };
    let status: boolean;

    const check = (
      key: string,
      path: string,
      comp: Flatten<AnyAtom["electronic"]>,
    ) => {
      const parent = path;
      switch (comp.scheme) {
        case CouplingScheme.LS:
          status = checkLS(parent, comp, errors);
          break;
        case CouplingScheme.LS1:
          status = checkLS1(parent, comp, errors);
          break;
        case CouplingScheme.J1L2:
          status = checkJ1L2(parent, comp, errors);
          break;
        default:
          status = false; // why am I here!?
      }
      if (key in bad) {
        const err = errors[errors.length - 1];
        expect(status).toEqual(false);
        expect(err.instancePath).toContain(path);
        // expect(err.params.scheme).toEqual(comp.scheme);  // fails on multipart
        // expect(err.params.allowed).toBeDefined();  // what's defined depends on the failed test
        // expect(err.message).toContain("");  // message varies depends on failed test
      } else {
        expect(status).toEqual(true);
      }
    };
    for (const [key, atom] of inputs_momenta_nok) {
      if (atom.type === "simple") continue;
      if (Array.isArray(atom.electronic)) {
        for (const [idx, comp] of atom.electronic.entries()) {
          check(key, `${key}/electronic/${idx}`, comp);
        }
      } else {
        check(key, `${key}/electronic`, atom.electronic);
      }
    }
    // console.log("Error: ", JSON.stringify(errors, null, 2));
    expect(errors.length).toEqual(4);
  });
});

describe("dispatchers", () => {
  test("component w/ no errors", () => {
    const check = (path: string, comp: Flatten<AnyAtom["electronic"]>) => {
      const errors: ErrorObject[] = [];
      const status = checkQuantumNumbers(path, comp, errors);
      expect(status).toEqual(true);
      expect(errors).toHaveLength(0);
    };
    for (const [key, atom] of inputs_ok) {
      if (atom.type === "simple") continue;
      if (Array.isArray(atom.electronic)) {
        for (const [idx, comp] of atom.electronic.entries()) {
          check(`${key}/electronic/${idx}`, comp);
        }
      } else {
        check(`${key}/electronic`, atom.electronic);
      }
    }
  });

  test("component w/ errors", () => {
    const bad: Dict = {
      second: { 0: "excited" },
      third: { 1: "core" },
      carbon: { 0: "P" },
    };
    const errors: ErrorObject[] = [];
    const check = (
      key: string,
      path: string,
      comp: Flatten<AnyAtom["electronic"]>,
    ) => {
      const status = checkQuantumNumbers(
        path,
        comp,
        errors,
      );
      if (
        key in bad
        // && Object.prototype.hasOwnProperty.call(bad[key], idx.toString())
      ) {
        expect(status).toEqual(false);
      } else {
        expect(status).toEqual(true);
      }
    };

    for (const [key, atom] of inputs_parity_nok) {
      if (atom.type === "simple") continue;
      if (Array.isArray(atom.electronic)) {
        for (const [idx, comp] of atom.electronic.entries()) {
          check(key, `${key}/electronic/${idx}`, comp);
        }
      } else {
        check(key, `${key}/electronic`, atom.electronic);
      }
    }
    /* 3 actual errors lead to 2 additional errors
       - second/0/excited has an malformed shell config: l > n,
       - third/1/core P is incorrect, so it doesn't match shell & term
    */
    expect(errors).toHaveLength(5);
  });

  test("jsonobject.states w/ no errors", () => {
    const errors: ErrorObject[] = checkStates(
      inputs_ok.filter((entry): entry is [string, State<AnyAtom>] =>
        entry[1].type !== "simple"
      ),
      [],
    );
    expect(errors).toHaveLength(0);
  });

  test("jsonobject.states w/ errors", () => {
    const errors: ErrorObject[] = checkStates(
      inputs_momenta_nok.filter((entry): entry is [string, State<AnyAtom>] =>
        entry[1].type !== "simple"
      ),
      [],
    );
    /* 4 actual errors lead to 1 additional different error
      - phosphorus/0/core has bad l in shell config, so parity also fails
    */
    expect(errors).toHaveLength(5);
  });
});
