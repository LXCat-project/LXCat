// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: Apache-2.0

import { RotationalImpl } from "../molecules/components/rotational";
import { ComponentParser, PUR } from "./common";

function parse_r_mr(r: PUR<RotationalImpl>): string {
  return r.J.toString();
}

export const rotationalParser: ComponentParser<PUR<RotationalImpl>> = {
  id: parse_r_mr,
  latex: parse_r_mr,
};
