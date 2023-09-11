// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { TypeTag } from "./generators";

export type SimpleParticle = {
  /**
   * @minLength 1
   */
  particle: string;
  /**
   * @asType integer
   */
  charge: number;
};

export type AnyParticle = TypeTag<"simple">;
