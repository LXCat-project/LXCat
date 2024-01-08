// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { typeTag } from "../generators.js";
import { SimpleParticle } from "./simple/particle.js";

export const AnyParticle = typeTag("simple").merge(SimpleParticle);
