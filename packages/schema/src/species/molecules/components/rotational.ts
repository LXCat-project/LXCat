// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { number, object } from "zod";
import { makeComponent } from "../../component.js";

const RotationalDescriptor = object({ J: number().int() });

export const Rotational = makeComponent(
  RotationalDescriptor,
  (rot) => rot.J.toString(),
  (rot) => rot.J.toString(),
);
