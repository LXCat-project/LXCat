import { ErrorObject } from "ajv";

import { CouplingScheme } from "../core/atoms/coupling_scheme";
import { AnyAtom } from "../core/atoms";
import { ShellEntry } from "../core/shell_entry";
import { InState } from "../core/state";
import { CrossSectionSetRaw } from "../css/input";

import { check_momenta, check_couplings } from "./coupling";
import { momenta_from_shell } from "./coupling";
import { parity, combine_parity } from "./parity";
import { AtomLS1Impl } from "../core/atoms/ls1";
import { AtomJ1L2Impl } from "../core/atoms/j1l2";
import { UAtomic } from "../core/generators";
import { AtomLSImpl } from "../core/atoms/ls";

export type Dict = {
  [x: string]: string | number | Dict;
};

export function shell_parities(config: ShellEntry[]) {
  return config.map((configItem) => parity(configItem.l, configItem.occupance));
}

export function check_momenta_from_shell(
  entries: ShellEntry[],
  L_expected: number,
  S_expected: number
) {
  let L = 0;
  let S = 0;

  for (const entry of entries) {
    // l_max = n - 1; num of l = 2*l + 1; max occupancy = 2* num of l
    if (entry.l >= entry.n || entry.occupance > 4 * entry.l + 2) {
      return {
        result: false,
        allowed: { L: undefined, S: undefined },
      };
    }
    let _L: number;
    let _S: number;
    [_L, _S] = momenta_from_shell(entry.l, entry.occupance);
    S += _S;
    L += _L;
  }

  const _allowed: Dict = { L: L, S: S };
  const res = {
    result: L == L_expected && S == S_expected,
    allowed: _allowed,
  };
  return res;
}

export class ValidateData {
  component: AnyAtomElectronic;
  err: ErrorObject;

  constructor(component: AnyAtomElectronic, err: ErrorObject) {
    this.component = component;
    this.err = err;
  }

  parity() {
    const config = this.component.config;

    if (config === undefined) return true;
    if (this.component.scheme == "LS") {
      if (!Array.isArray(config)) return true; // nothing to check

      const _P: number = combine_parity(shell_parities(config));
      if (this.component.term.P != _P) {
        this.err.params.allowed.P = _P;
        this.err.message += `:bad P`;
        return false;
      }
      return true;
    } else {
      if (!("core" in config)) return true; // nothing to check

      const _Ps: number[] = [];
      let status = true;
      for (const [key, comp] of Object.entries(config)) {
        _Ps.push(combine_parity(shell_parities(comp.config)));
        if (comp.term.P != _Ps[_Ps.length - 1]) {
          this.err.params.allowed[key] = { P: _Ps[_Ps.length - 1] };
          this.err.message += `:bad ${key}.P`;
          status = false;
        }
      }

      const _P: number = combine_parity(_Ps);
      if (this.component.term.P != _P) {
        this.err.params.allowed.P = _P;
        this.err.message += ":bad P";
        status = false;
      }
      return status;
    }
  }

  LS() {
    const term = this.component.term!;

    if (!("L" in term) || "core" in this.component.config!) return false; // never true
    const res0 = check_momenta_from_shell(
      this.component.config!,
      term.L,
      term.S
    );
    if (!res0.result) {
      Object.entries(res0.allowed).forEach(
        ([k, v]) => (this.err.params.allowed[k] = v)
      );
      this.err.message += Object.keys(res0.allowed).reduce(
        (r, i) => `${r}:bad ${i}`,
        ""
      );
    }
    const res = check_momenta(term.L, term.S, term.J);
    if (!res.result) {
      this.err.params.allowed.J = res.allowed;
      this.err.message += ":bad J";
    }
    return res0.result && res.result;
  }

  get_Ls_Ss() {
    const config = this.component.config!;
    const term = this.component.term!;

    if (!("L" in term) || "core" in config) return [0, 0, 0, 0]; // never true
    // NOTE: assumes config must have core and excited
    const [L1, L2] = Object.values(config).map(
      (val: any, _: any) => val.term.L
    );
    const [S1, S2] = Object.values(config).map(
      (val: any, _: any) => val.term.S
    );
    return [L1, L2, S1, S2];
  }

  check_shell_config() {
    const empty: Dict = {};
    // FIXME: parametrise errors
    if (this.component.config === undefined || !("core" in this.component.config)) return false; // never true
    const core = this.component.config.core;
    const res_c = check_momenta_from_shell(
      core.config,
      core.term.L,
      core.term.S
    );
    if (!res_c.result) {
      // FIXME: overwrites anything set before
      this.err.params.allowed.core = res_c.allowed;
      this.err.message += Object.keys(res_c.allowed).reduce(
        (r, i) => `${r}:bad core.${i}`,
        ""
      );
    } else {
      this.err.params.allowed.core = empty;
    }
    const excited = this.component.config.excited;
    const res_e = check_momenta_from_shell(
      excited.config,
      excited.term.L,
      excited.term.S
    );
    if (!res_e.result) {
      this.err.params.allowed.excited = res_e.allowed;
      this.err.message += Object.keys(res_e.allowed).reduce(
        (r, i) => `${r}:bad excited.${i}`,
        ""
      );
    } else {
      this.err.params.allowed.excited = empty;
    }
    return res_c.result && res_e.result;
  }

  LS1() {
    const term = this.component.term!;
    if (!("K" in term)) return false; // never true
    const [L1, L2, S1, S2] = this.get_Ls_Ss();

    const res_shell = this.check_shell_config();

    const res1 = check_couplings(L1, L2, S1, term.K);
    if (!res1.result) {
      this.err.params.allowed.K = res1.allowed;
      this.err.message += ":bad K";
    }
    const res2 = check_momenta(term.K, S2, term.J);
    if (!res2.result) {
      this.err.params.allowed.J = res2.allowed;
      this.err.message += ":bad J";
    }
    return res_shell && res1.result && res2.result;
  }

  J1L2() {
    const term = this.component.term!;
    const [L1, L2, S1, S2] = this.get_Ls_Ss();
    if (Array.isArray(this.component.config) || !("J" in this.component.config!.core.term) || !("K" in term)) return false; // never true
    const J1 = this.component.config!.core.term.J!;

    const res_shell = this.check_shell_config();

    const res1 = check_momenta(L1, S1, J1);
    if (!res1.result) {
      this.err.params.allowed.core.J = res1.allowed;
      this.err.message += ":bad core.J";
    }

    const res2 = check_momenta(J1, L2, term.K);
    if (!res2.result) {
      this.err.params.allowed.K = res2.allowed;
      this.err.message += ":bad K";
    }

    const res3 = check_momenta(term.K, S2, term.J);
    if (!res3.result) {
      this.err.params.allowed.J = res3.allowed;
      this.err.message += ":bad J";
    }
    return res_shell && res1.result && res2.result && res3.result;
  }

  /*
  J1J2() {
    const term = this.component.term;
    const [L1, L2, S1, S2] = this.get_Ls_Ss();
    if (Array.isArray(this.component.config!) || !("J" in this.component.config!.core.term) || !("J" in this.component.config!.excited.term)) return false; // never true
    const J1 = this.component.config!.core.term.J;
    const J2 = this.component.config!.excited.term.J;

    const res_shell = this.check_shell_config();

    const res1 = check_momenta(L1, S1, J1);
    if (!res1.result) {
      this.err.params.allowed.core.J = res1.allowed;
      this.err.message += ":bad core.J";
    }

    const res2 = check_momenta(L2, S2, J2);
    if (!res2.result) {
      this.err.params.allowed.excited.J = res2.allowed;
      this.err.message += ":bad excited.J";
    }

    const res3 = check_momenta(J1, J2, term.J);
    if (!res3.result) {
      this.err.params.allowed.J = res3.allowed;
      this.err.message += ":bad J";
    }
    return res_shell && res1.result && res2.result && res2.result;
  }
  */
}

export function get_states(jsonobj: CrossSectionSetRaw) {
  // retain keys for error message later
  const atomTypes = new Set(["AtomLS", "AtomLS1", "AtomJ1L2"]);
  const states = Object.entries(jsonobj.states).filter(
    ([_k, v]) => v.type && atomTypes.has(v.type)
  );
  return states;
}

type AnyAtomElectronic = (Record<string, unknown> & (AtomLSImpl | UAtomic<AtomLSImpl>)) | (Record<string, unknown> & (AtomLS1Impl | UAtomic<AtomLS1Impl>)) | (Record<string, unknown> & (AtomJ1L2Impl | UAtomic<AtomJ1L2Impl>));

export function get_errobj(parent: string, component: AnyAtomElectronic) {
  const _allowed: Dict = {};
  const err: ErrorObject = {
    keyword: `${component.scheme} coupling`,
    instancePath: parent,
    schemaPath: "",
    params: {
      scheme: component.scheme,
      config: component.config,
      term: component.term,
      allowed: _allowed,
    },
    message: "",
  };
  return err;
}

export function check_quantum_numbers(
  parent: string,
  component: AnyAtomElectronic,
  errors: ErrorObject[]
) {
  const scheme = component.scheme;
  const err = get_errobj(parent, component);
  const validator = new ValidateData(component, err);
  switch (scheme) {
    case CouplingScheme.LS:
      if (!validator.LS() || !validator.parity()) {
        errors.push(err);
      }
      break;
    case CouplingScheme.LS1:
      if (!validator.LS1() || !validator.parity()) {
        errors.push(err);
      }
      break;
    case CouplingScheme.J1L2:
      if (!validator.J1L2() || !validator.parity()) {
        errors.push(err);
      }
      break;
    // FIXME: uncomment, when the J1J2 coupling scheme is defined
    // case CouplingScheme.J1J2:
    //   if (!validator.J1J2() || !validator.parity()) {
    //     errors.push(err);
    //   }
    //   break;
    default:
      err.message = `unknown coupling scheme: ${scheme}`;
      errors.push(err);
  }
  return errors;
}

export function check_states(states: [string, InState<AnyAtom>][], errors: ErrorObject[]) {
  for (const [key, atom] of states) {
    const _type = atom["type"];
    if (!(_type && _type.startsWith("Atom"))) continue;
    for (const [idx, component] of atom.electronic.entries()) {
      if (!component.scheme) continue; // some don't have scheme
      const err = check_quantum_numbers(
        `${key}:${atom.particle}/electronic[${idx}]`,
        component,
        errors
      );
    }
  }
  return errors;
}
