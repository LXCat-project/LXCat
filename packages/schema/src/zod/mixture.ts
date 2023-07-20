// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { Reference } from "./common/reference";
import { SelfReference, SetHeader } from "./document";
import { AnyProcess } from "./process";
import { State } from "./state";

// TODO: Add a `refine` that checks whether the referenced state and reference
//       keys actually exist in the respective objects.
const MixtureBody = z.object({
  sets: z.record(SetHeader),
  references: z.record(Reference),
  states: z.record(State),
  processes: z.array(AnyProcess(z.string(), z.string())),
});

export const LTPMixture = SelfReference.merge(MixtureBody);
