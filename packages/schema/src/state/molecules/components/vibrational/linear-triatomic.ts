// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { number, object, tuple } from "zod";
import { makeComponent } from "../../../component";

const LinearTriatomVibrationalDescriptor = object({
  v: tuple([number().int(), number().int(), number().int()]),
});

export const LinearTriatomVibrational = makeComponent(
  LinearTriatomVibrationalDescriptor,
  (vib) => vib.v.join(","),
  (vib) => vib.v.join(","),
);
