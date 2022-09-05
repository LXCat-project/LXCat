import { J1L2Term, AtomJ1L2Impl } from "../atoms/j1l2";
import { LSTermImpl, LSTerm, AtomLSImpl } from "../atoms/ls";
import { LS1Term, AtomLS1Impl } from "../atoms/ls1";
import { ShellEntry } from "../shell_entry";
import { UE, UV, UR, UAtomic } from "../generators";
import { LinearElectronicImpl } from "../molecules/components/electronic/linear";
import { LinearInversionCenterElectronicImpl } from "../molecules/components/electronic/linear_inversion_center";
import { RotationalImpl } from "../molecules/components/rotational";
import { DiatomicVibrationalImpl } from "../molecules/components/vibrational/diatomic";
import { LinearTriatomVibrationalImpl } from "../molecules/components/vibrational/linear_triatomic";

const electronic_orbital = ["s", "p", "d", "f", "g", "h"];
const atomic_orbital = ["S", "P", "D", "F", "G", "H"];
const molecular_orbital = ["\\Sigma", "\\Pi", "\\Delta"];

// TODO: Parsing function could possibly also perform physical checks on data.

// Helper types
// Possibly Undefined Electronic/Vibrational/Rotational
// TODO: Move these into library. Second arguments in UE and UV should probably be default.
type PUE<T> = T | UE<T, "vibrational">;
type PUV<T> = T | UV<T, "rotational">;
type PUR<T> = T | UR<T>;
// Possibly Undefined Atomic
type PUA<T> = T | UAtomic<T>;

function parse_shell_entry(entry: ShellEntry): string {
  if (entry.occupance == 0) {
    return "";
  }

  return `${entry.n}${electronic_orbital[entry.l]}${
    entry.occupance > 1 ? `^{${entry.occupance}}` : ""
  }`;
}

function parse_shell_config(config: Array<ShellEntry>): string {
  let ret = "";

  for (const entry of config) {
    ret += parse_shell_entry(entry);
  }

  return ret;
}

// TODO: Move type specific parsers to their dedicated files (in this folder).
function parse_LS_term_impl(term: LSTermImpl): string {
  return `^{${2 * term.S + 1}}${atomic_orbital[term.L]}${
    term.P == -1 ? "^o" : ""
  }`;
}

function parse_LS_term(term: LSTerm): string {
  return `${parse_LS_term_impl(term)}_{${parse_div_two(term.J)}}`;
}

export function parse_LS(e: PUA<AtomLSImpl>): string {
  if (e.term === undefined) {
    return e.e;
  }

  const config = parse_shell_config(e.config);

  return `${config}${config != "" ? ":" : ""}${parse_LS_term(e.term)}`;
}

function parse_div_two(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  if (Number.isInteger(n * 2)) return `${n * 2}/2`;

  throw new Error(`Number ${n} is not an integer or a half integer.`);
}

function parse_J1L2_term(term: J1L2Term): string {
  return `^{${2 * term.S + 1}}[${parse_div_two(term.K)}]${
    term.P == -1 ? "^o" : ""
  }_{${parse_div_two(term.J)}}`;
}

export function parse_J1L2(e: PUA<AtomJ1L2Impl>): string {
  if (e.term === undefined) {
    return e.e;
  }

  const config =
    parse_shell_config(e.config.core.config) +
    "(" +
    parse_LS_term(e.config.core.term) +
    ")" +
    parse_shell_config(e.config.excited.config) +
    "(" +
    parse_LS_term_impl(e.config.excited.term) +
    ")";

  return config + parse_J1L2_term(e.term);
}

function parse_LS1_term(term: LS1Term): string {
  return `${atomic_orbital[term.L]}^{${2 * term.S + 1}}[${parse_div_two(
    term.K
  )}]${term.P == -1 ? "^o" : ""}_{${parse_div_two(term.J)}}`;
}

export function parse_LS1(e: PUA<AtomLS1Impl>): string {
  if (e.term === undefined) {
    return e.e;
  }

  const config =
    parse_shell_config(e.config.core.config) +
    "(" +
    parse_LS_term_impl(e.config.core.term) +
    ")" +
    parse_shell_config(e.config.excited.config) +
    "(" +
    parse_LS_term_impl(e.config.excited.term) +
    ")";

  return config + parse_LS1_term(e.term);
}

export function parse_e_me(e: PUE<LinearElectronicImpl>): string {
  if (e.Lambda === undefined) {
    return e.e;
  }

  let ref_s = "";

  if (e.reflection !== undefined) {
    ref_s = "^" + e.reflection;
  }

  return `${e.e}^{${2 * e.S + 1}}${molecular_orbital[e.Lambda]}${ref_s}`;
}

export function parse_e_lice(
  e: PUE<LinearInversionCenterElectronicImpl>
): string {
  if (e.Lambda === undefined) {
    return e.e;
  }

  let ref_s = "";

  if (e.reflection !== undefined) {
    ref_s = "^" + e.reflection;
  }

  return `${e.e}^{${2 * e.S + 1}}${molecular_orbital[e.Lambda]}_{${
    e.parity
  }}${ref_s}`;
}

export function parse_v_hdv(v: PUV<DiatomicVibrationalImpl>): string {
  return v.v.toString();
}

export function parse_v_ltv(v: PUV<LinearTriatomVibrationalImpl>): string {
  return v.v.toString();
}

export function parse_r_mr(r: PUR<RotationalImpl>): string {
  return r.J.toString();
}
