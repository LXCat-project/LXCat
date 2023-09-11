// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { RotationalImpl } from "../molecules/components/rotational";
import { ComponentParser } from "./common";

function parse_r_mr(r: RotationalImpl): string {
  return r.J.toString();
}

export const rotationalParser: ComponentParser<RotationalImpl> = {
  id: parse_r_mr,
  latex: parse_r_mr,
};
