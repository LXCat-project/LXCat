// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { DiatomicVibrationalImpl } from "../molecules/components/vibrational/diatomic";
import { ComponentParser } from "./common";

function parse_v_dv(v: DiatomicVibrationalImpl): string {
  return v.v.toString();
}

export const diatomicVibrationalParser: ComponentParser<
  DiatomicVibrationalImpl
> = {
  id: parse_v_dv,
  latex: parse_v_dv,
};
