// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { ShellEntry } from "../shell_entry";

export const electronic_orbital = ["s", "p", "d", "f", "g", "h"];
export const atomic_orbital = ["S", "P", "D", "F", "G", "H"];

export const molecular_orbital = ["S", "P", "D", "F", "G"];
export const molecular_orbital_latex = [
  "\\Sigma",
  "\\Pi",
  "\\Delta",
  "\\Phi",
  "\\Gamma",
];

export interface ComponentParser<Component> {
  id(state: Component): string;
  latex(state: Component): string;
}

// TODO: Parsing function could possibly also perform physical checks on data.

function parse_shell_entry(entry: ShellEntry): string {
  if (entry.occupance == 0) {
    return "";
  }

  return `${entry.n}${electronic_orbital[entry.l]}${
    entry.occupance > 1 ? `^{${entry.occupance}}` : ""
  }`;
}

export function parse_shell_config(config: Array<ShellEntry>): string {
  return config.reduce((total, entry) => total + parse_shell_entry(entry), "");
}

export function parse_div_two(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  if (Number.isInteger(n * 2)) return `${n * 2}/2`;

  throw new Error(`Number ${n} is not an integer or a half integer.`);
}
