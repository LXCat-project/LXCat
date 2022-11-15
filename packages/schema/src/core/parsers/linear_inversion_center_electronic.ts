// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { LinearInversionCenterElectronicImpl } from "../molecules/components/electronic/linear_inversion_center";
import {
  ComponentParser,
  molecular_orbital,
  molecular_orbital_latex,
  PUE,
} from "./common";

function parse_e_lice(e: PUE<LinearInversionCenterElectronicImpl>): string {
  if (e.Lambda === undefined) {
    return e.e;
  }

  let ref_s = "";

  if (e.reflection !== undefined) {
    ref_s = "^" + e.reflection;
  }

  return `${e.e}^${2 * e.S + 1}${molecular_orbital[e.Lambda]}_${
    e.parity
  }${ref_s}`;
}

function parse_e_lice_latex(
  e: PUE<LinearInversionCenterElectronicImpl>
): string {
  if (e.Lambda === undefined) {
    return e.e;
  }

  let ref_s = "";

  if (e.reflection !== undefined) {
    ref_s = "^" + e.reflection;
  }

  return `\\mathrm{${e.e}}^{${2 * e.S + 1}}${
    molecular_orbital_latex[e.Lambda]
  }_\\mathrm{${e.parity}}${ref_s}`;
}

export const linearInversionCenterElectronicParser: ComponentParser<
  PUE<LinearInversionCenterElectronicImpl>
> = {
  id: parse_e_lice,
  latex: parse_e_lice_latex,
};
