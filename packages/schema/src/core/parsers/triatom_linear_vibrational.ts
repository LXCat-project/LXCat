// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: Apache-2.0

import { LinearTriatomVibrationalImpl } from "../molecules/components/vibrational/linear_triatomic";
import { ComponentParser, PUV } from "./common";

function parse_v_ltv(v: PUV<LinearTriatomVibrationalImpl>): string {
  return v.v.toString();
}

export const linearTriatomVibrationalParser: ComponentParser<
  PUV<LinearTriatomVibrationalImpl>
> = {
  id: parse_v_ltv,
  latex: parse_v_ltv,
};
