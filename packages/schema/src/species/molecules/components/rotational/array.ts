// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, number, object } from "zod";
import { makeComponent } from "../../../component.js";

const RotationalArrayDescriptor = (size: number) =>
  object({
    J: array(number().nonnegative().int()).length(size),
  });

export const RotationalArray = (size: number) =>
  makeComponent(
    RotationalArrayDescriptor(size),
    (rot) => rot.J.join(","),
    (rot) => rot.J.join(","),
  );
