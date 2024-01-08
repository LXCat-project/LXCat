// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { number, object } from "zod";
import { makeComponent } from "../../../component.js";

const DiatomicVibrationalDescriptor = object({ v: number().int() });

export const DiatomicVibrational = makeComponent(
  DiatomicVibrationalDescriptor,
  (vib) => vib.v.toString(),
  (vib) => vib.v.toString(),
);
