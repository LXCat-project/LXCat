import { ErrorObject } from "ajv";

import { CouplingScheme } from "../core/atoms/coupling_scheme";
import { AnyAtom } from "../core/atoms";
import { ShellEntry } from "../core/shell_entry";

import { check_momenta, check_couplings } from "./coupling";
import { parity, combine_parity } from "./parity";

export type Dict = {
  [x: string] : string | number | Dict;  
};

export function shell_parities(config: ShellEntry[]) {
    return config.map((_conf: any) => parity(_conf.l, _conf.occupance));
}

export class ValidateData {
    component: any;
    err: any;

    constructor (component: any, err: any) {
	this.component = component;
	this.err = err;
    }

    parity() {
	const config = this.component.config

	if (config.scheme == "AtomLS") {
	    if (config.length < 1) return true; // nothing to check

	    const _P: number = combine_parity(shell_parities(config));
	    if (this.component.term.P != _P) {
		this.err.params.allowed.P = _P;
		this.err.message += `:bad P`;
		return false;
	    }
	    return true;
	} else {
	    if (Object.keys(config).length < 1) return true; // nothing to check

	    let _Ps: number[] = [];
	    let status: boolean = true;
	    for (const [key, comp] of Object.entries(config)) {
		_Ps.push(combine_parity(shell_parities(comp.config)));
		if (comp.term.P != _Ps[_Ps.length - 1]) {
		    this.err.params.allowed[key] = {P: _Ps[_Ps.length - 1]};
		    this.err.message += `:bad ${key}.P`;
		    status = false;
		}
	    }

	    const _P: number = combine_parity(_Ps);
	    if (this.component.term.P != (_P)) {
		this.err.params.allowed.P = _P;
		this.err.message += ":bad P";
		status = false;
	    }
	    return status;
	}
    }

    LS() {
	// FIXME: should we also check config, and calc l -> L?
	let term = this.component.term;
	let res = check_momenta(term.L, term.S, term.J);
	if (!res.result) {
            this.err.params.allowed.J = res.allowed;
            this.err.message += ":bad J";
	}
	return res.result
    }

    LS1() {
	let config = this.component.config;
	let term = this.component.term;
	// NOTE: assumes config must have core and excited, is this correct?
	const [L1, L2] = config.values().map((val: any, _: any) => val.term.L);
	const [S1, S2] = config.values().map((val: any, _: any) => val.term.S);

	let res1 = check_couplings(L1, L2, S1, term.K);
	if (!res1.result) {
            this.err.params.allowed.K = res1.allowed;
            this.err.message += ":bad K";
	}
	let res2 = check_momenta(term.K, S2, term.J);
	if (!res2.result) {
            this.err.params.allowed.J = res2.allowed;
            this.err.message += ":bad J";
	}
	return res1.result && res2.result;
    }

    J1L2() {
	// FIXME: code duplication
	let config = this.component.config;
	let term = this.component.term;
	// NOTE: assumes config must have core and excited, is this correct?
	const [L1, L2] = Object.values(config).map((val: any, _: any) => val.term.L);
	const [S1, S2] = Object.values(config).map((val: any, _: any) => val.term.S);
	const J1 = config.core.term.J;

	let res1 = check_momenta(L1, S1, J1);
	if (!res1.result) {
            this.err.params.allowed.core = {J: res1.allowed};
            this.err.message += ":bad core.J";
	}

	let res2 = check_momenta(J1, L2, term.K);
	if (!res2.result) {
            this.err.params.allowed.K = res2.allowed;
            this.err.message += ":bad K";
	}

	let res3 = check_momenta(term.K, S2, term.J);
	if (!res3.result) {
            this.err.params.allowed.J = res3.allowed;
            this.err.message += ":bad J";
	}
	return res1.result && res2.result && res3.result;
    }
}

export function get_states(jsonobj: any) {
    let states: [string, AnyAtom][] = Object.entries(jsonobj["states"]).filter(
	s => s[1]["type"] && s[1]["type"].startsWith("Atom")
    );
    return states
}

export function get_errobj(parent: string, component: any) {
    let _allowed: Dict = {};
    var err: ErrorObject = {
        keyword: `${component.scheme} coupling`,
        instancePath: parent,
        schemaPath: "",
        params: {
            scheme: component.scheme,
            config: component.config,
            term: component.term,
            allowed: _allowed,
        },
        message: ""
    };
    return err
}

export function check_quantum_numbers(parent: string, component: any, errors: ErrorObject[]) {
    let scheme: string = component.scheme;
    let err = get_errobj(parent, component);
    let validator = new ValidateData(component, err);
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
        default:
            err.message = `unknown coupling scheme: ${scheme}`;
            errors.push(err);
    }
    return errors;
}

export function check_states(states: any, errors: ErrorObject[]) {
    for (const key in states) {
        let _type: string = states[key]["type"];
        if (!(_type && _type.startsWith("Atom"))) continue;
        for (const component of states[key].electronic) {
            if (!component.scheme) continue; // some don't have scheme
            check_quantum_numbers(`${key}:${states[key].particle}/electronic`, component, errors);
        }
    }
    return errors
}
