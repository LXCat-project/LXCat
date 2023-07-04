// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { LinearTriatomVibrationalImpl } from "../molecules/components/vibrational/linear_triatomic";
import { ComponentParser } from "./common";

function parse_v_ltv(v: LinearTriatomVibrationalImpl): string {
  return v.v.toString();
}

export const linearTriatomVibrationalParser: ComponentParser<
  LinearTriatomVibrationalImpl
> = {
  id: parse_v_ltv,
  latex: parse_v_ltv,
};
