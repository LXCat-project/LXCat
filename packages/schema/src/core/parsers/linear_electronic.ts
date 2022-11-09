// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { LinearElectronicImpl } from "../molecules/components/electronic/linear";
import {
  ComponentParser,
  molecular_orbital,
  molecular_orbital_latex,
  PUE,
} from "./common";

function parse_e_le(e: PUE<LinearElectronicImpl>): string {
  if (e.Lambda === undefined) {
    return e.e;
  }

  let ref_s = "";

  if (e.reflection !== undefined) {
    ref_s = "^" + e.reflection;
  }

  return `${e.e}^${2 * e.S + 1}${molecular_orbital[e.Lambda]}${ref_s}`;
}

function parse_e_le_latex(e: PUE<LinearElectronicImpl>): string {
  if (e.Lambda === undefined) {
    return e.e;
  }

  let ref_s = "";

  if (e.reflection !== undefined) {
    ref_s = "^" + e.reflection;
  }

  return `${e.e}^{${2 * e.S + 1}}${molecular_orbital_latex[e.Lambda]}${ref_s}`;
}

export const linearElectronicParser: ComponentParser<
  PUE<LinearElectronicImpl>
> = {
  id: parse_e_le,
  latex: parse_e_le_latex,
};
