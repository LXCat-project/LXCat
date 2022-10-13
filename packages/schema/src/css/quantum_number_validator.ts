import { ErrorObject } from "ajv";

import { CouplingScheme } from "../core/atoms/coupling_scheme";
import { AnyAtom } from "../core/atoms";
import { InState } from "../core/state";
import { CrossSectionSetRaw } from "../css/input";

import { check_momenta_from_shell, check_momenta } from "./coupling";
import { Dict } from "./common";
import { shell_parities, combine_parity } from "./parity";
import { AtomLS1Impl } from "../core/atoms/ls1";
import { AtomJ1L2Impl } from "../core/atoms/j1l2";
import { AtomLSImpl, LSTerm, LSTermImpl } from "../core/atoms/ls";
import { ShellEntry } from "../core/shell_entry";

export function get_errobj(
  parent: string,
  component: AtomLSImpl | AtomLS1Impl | AtomJ1L2Impl,
  allowed: Dict,
  message: string
): ErrorObject {
  const err: ErrorObject = {
    keyword: `${component.scheme} coupling`,
    instancePath: parent,
    schemaPath: "",
    params: { ...component, allowed },
    message,
  };
  return err;
}

export function check_parity(
  parent: string,
  component: AtomLSImpl | AtomLS1Impl | AtomJ1L2Impl,
  errors: ErrorObject[]
) {
  const config = component.config;
  function message(_config: any, _parity: number) {
    const strobj = JSON.stringify(_config, null).replace(/"/g, "");
    return `term incosistent with config: for ${strobj}, parity should be ${_parity}`;
  }

  if (config === undefined) return true;
  if (component.scheme == "LS") {
    if (!Array.isArray(config)) return true; // nothing to check

    const _P: number = combine_parity(shell_parities(config));
    if (component.term.P != _P) {
      const err = get_errobj(parent, component, { P: _P }, message(config, _P));
      errors.push(err);
      return false;
    }
    return true;
  } else {
    if (!("core" in config)) return true; // nothing to check

    const _Ps: number[] = [];
    let status = true;
    for (const [key, comp] of Object.entries(config)) {
      const __P = combine_parity(shell_parities(comp.config));
      if (comp.term.P != __P) {
        const err = get_errobj(
          `${parent}/config/${key}`,
          comp,
          { P: __P },
          message(comp.config, __P)
        );
        errors.push(err);
        status = status && false;
      }
      _Ps.push(__P);
    }

    const _P: number = combine_parity(_Ps);
    if (component.term.P != _P) {
      const err = get_errobj(parent, component, { P: _P }, message(config, _P));
      errors.push(err);
      status = status && false;
    }
    return status;
  }
}

function check_shell_config(
  parent: string,
  subkey: "core" | "excited" | "",
  component: AtomLSImpl | AtomLS1Impl | AtomJ1L2Impl,
  errors: ErrorObject[]
): boolean {
  let shell: ShellEntry[];
  let term: LSTermImpl;
  if (component.scheme == CouplingScheme.LS) {
    shell = component.config;
    term = component.term;
  } else {
    parent = `${parent}/config/${subkey}`;
    let sub = component.config[subkey as keyof typeof component.config];
    shell = sub.config;
    term = sub.term;
  }
  return check_shell_config_impl(parent, component, shell, term, errors);
}

function check_shell_config_impl(
  parent: string,
  component: AtomLSImpl | AtomLS1Impl | AtomJ1L2Impl,
  shell: ShellEntry[],
  term: LSTermImpl,
  errors: ErrorObject[]
): boolean {
  const res0 = check_momenta_from_shell(shell, term.L, term.S);
  if (!res0.result) {
    let err: ErrorObject;
    if (Object.keys(res0.allowed).length === 0) {
      err = get_errobj(parent, component, {}, `bad shell config: ${shell}`);
    } else {
      const strobj = JSON.stringify(shell, null).replace(/"/g, "");
      err = get_errobj(
        parent,
        component,
        res0.allowed,
        `term inconsistent with config: for ${strobj}, L should be one of ${res0.allowed.L}, and S=${res0.allowed.S}`
      );
    }
    errors.push(err);
  }
  return res0.result;
}

export function check_LS(
  parent: string,
  component: AtomLSImpl,
  errors: ErrorObject[]
): boolean {
  /* NOTE: assumes for LS coupling, config never has core & excited */
  //  AtomLSImpl['term']
  const res0 = check_shell_config(parent, "", component, errors);
  return res0;
}

function get_term_momenta(
  component: AtomLS1Impl | AtomJ1L2Impl
): [number, number, number, number] {
  // NOTE: assumes config must have core and excited
  const [L1, L2] = Object.values(component.config).map((val) => val.term.L);
  const [S1, S2] = Object.values(component.config).map((val) => val.term.S);
  return [L1, L2, S1, S2];
}

function check_shell_config_core_excited(
  parent: string,
  component: AtomLS1Impl | AtomJ1L2Impl,
  errors: ErrorObject[]
): boolean {
  let res: boolean = true;
  for (let subkey of ["core", "excited"]) {
    res = res && check_shell_config(parent, subkey as "core" | "excited", component, errors);
  }
  return res;
}

export function check_LS1(
  parent: string,
  component: AtomLS1Impl,
  errors: ErrorObject[]
): boolean {
  const term = component.term!;
  const [L1, L2, S1, S2] = get_term_momenta(component);

  const res_shell = check_shell_config_core_excited(parent, component, errors);

  const res1 = check_momenta(L1, L2, term.L);
  if (!res1.result) {
    const err = get_errobj(
      parent,
      component,
      { L: res1.allowed },
      `term inconsistent with config: with L1=${L1}, L2=${L2}, L should be one of ${res1.allowed}`
    );
    errors.push(err);
  }

  const res2 = check_momenta(term.L, S1, term.K);
  if (!res2.result) {
    const err = get_errobj(
      parent,
      component,
      { K: res2.allowed },
      `term inconsistent with config: with L=${term.L}, S1=${S1}, K should be one of ${res2.allowed}`
    );
    errors.push(err);
  }

  const res3 = check_momenta(term.K, S2, term.J);
  if (!res3.result) {
    const err = get_errobj(
      parent,
      component,
      { J: res3.allowed },
      `term inconsistent: with K=${term.K}, S2=${S2}, J should be one of ${res3.allowed}`
    );
    errors.push(err);
  }
  return res_shell && res1.result && res2.result && res3.result;
}

export function check_J1L2(
  parent: string,
  component: AtomJ1L2Impl,
  errors: ErrorObject[]
): boolean {
  const term = component.term!;
  const [L1, L2, S1, S2] = get_term_momenta(component);
  const J1 = component.config!.core.term.J!;

  const res_shell = check_shell_config_core_excited(parent, component, errors);

  const res1 = check_momenta(L1, S1, J1);
  if (!res1.result) {
    const err = get_errobj(
      `${parent}/config/core`,
      component.config.core,
      { J: res1.allowed },
      `term inconsistent: with L1=${L1}, S1=${S1}, J1 should be one of ${res1.allowed}`
    );
    errors.push(err);
  }

  const res2 = check_momenta(J1, L2, term.K);
  if (!res2.result) {
    const err = get_errobj(
      parent,
      component,
      { K: res2.allowed },
      `term inconsistent: with J1=${J1}, L2=${L2}, K should be one of ${res2.allowed}`
    );
    errors.push(err);
  }

  const res3 = check_momenta(term.K, S2, term.J);
  if (!res3.result) {
    const err = get_errobj(
      parent,
      component,
      { J: res3.allowed },
      `term inconsistent: with K=${term.K}, S2=${S2}, J should be one of ${res3.allowed}`
    );
    errors.push(err);
  }
  return res_shell && res1.result && res2.result && res3.result;
}

/*
export function J1J2(parent, component: AtomJ1J2Impl, errors: ErrorObject[]): boolean {
  const term = component.term;
  const [L1, L2, S1, S2] = get_term_momenta(component);
  const J1 = component.config!.core.term.J;
  const J2 = component.config!.excited.term.J;

  const res_shell = check_shell_config_core_excited(parent, component, errors);

  const res1 = check_momenta(L1, S1, J1);
  if (!res1.result) {
    err.params.allowed.core.J = res1.allowed;
    err.message += ":bad core.J";
  }

  const res2 = check_momenta(L2, S2, J2);
  if (!res2.result) {
    err.params.allowed.excited.J = res2.allowed;
    err.message += ":bad excited.J";
  }

  const res3 = check_momenta(J1, J2, term.J);
  if (!res3.result) {
    err.params.allowed.J = res3.allowed;
    err.message += ":bad J";
  }
  return res_shell && res1.result && res2.result && res2.result;
}
*/

export function get_states(jsonobj: CrossSectionSetRaw) {
  // retain keys for error message later
  const atomTypes = new Set(["AtomLS", "AtomLS1", "AtomJ1L2"]);
  const states = Object.entries(jsonobj.states).filter(
    (e): e is [string, InState<AnyAtom>] =>
      e[1].type !== undefined && atomTypes.has(e[1].type)
  );
  return states;
}

export function check_quantum_numbers(
  parent: string,
  component: AtomLSImpl | AtomLS1Impl | AtomJ1L2Impl,
  errors: ErrorObject[]
) {
  let status = true;
  const scheme = component.scheme;
  switch (scheme) {
    case CouplingScheme.LS:
      status =
        status &&
        check_parity(parent, component, errors) &&
        check_LS(parent, component, errors);
      break;
    case CouplingScheme.LS1:
      status =
        status &&
        check_parity(parent, component, errors) &&
        check_LS1(parent, component, errors);
      break;
    case CouplingScheme.J1L2:
      status =
        status &&
        check_parity(parent, component, errors) &&
        check_J1L2(parent, component, errors);
      break;
    // FIXME: uncomment, when the J1J2 coupling scheme is defined
    // case CouplingScheme.J1J2:
    //   status = status && check_parity(parent, component, errors) && check_J1J2(parent, component, errors);
    //   break;
    default: {
      const err = get_errobj(
        parent,
        component,
        {},
        `unknown coupling scheme: ${scheme}`
      );
      errors.push(err);
      status = false;
    }
  }
  return status;
}

export function check_states(
  states: [string, InState<AnyAtom>][],
  errors: ErrorObject[]
) {
  for (const [key, atom] of states) {
    const _type = atom["type"];
    if (!(_type && _type.startsWith("Atom"))) continue;
    for (const [idx, component] of atom.electronic!.entries()) {
      if (!component.scheme) continue; // some don't have scheme
      check_quantum_numbers(`${key}/electronic/${idx}`, component, errors);
    }
  }
  return errors;
}
