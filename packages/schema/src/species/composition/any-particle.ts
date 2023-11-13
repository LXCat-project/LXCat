// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { typeTag } from "../generators";
import { SimpleParticle } from "./simple/particle";

export const AnyParticle = typeTag("simple").merge(SimpleParticle);
