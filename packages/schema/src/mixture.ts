// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { output, z } from "zod";
import { Reference } from "./common/reference";
import { SelfReference, SetHeader } from "./document";
import { AnyProcess } from "./process";
import { AnySpecies } from "./species";

// TODO: Add a `refine` that checks whether the referenced state and reference
//       keys actually exist in the respective objects.
const MixtureBody = z.object({
  sets: z.record(SetHeader),
  references: z.record(Reference),
  states: z.record(AnySpecies),
  processes: z.array(AnyProcess(z.string(), z.string())),
});

export const LTPMixture = SelfReference
  .merge(MixtureBody)
  .refine(
    (doc) =>
      doc.processes
        .flatMap((process) => process.reaction.lhs)
        .every(({ state }) => state in doc.states)
      && doc.processes
        .flatMap((process) => process.reaction.rhs)
        .every(({ state }) => state in doc.states),
    "Referenced state key is missing in states record.",
  )
  .refine(
    (doc) =>
      doc.processes
        .flatMap(({ info }) => Array.isArray(info) ? info : [info])
        .flatMap(({ references }) => references)
        .every((reference) => reference in doc.references),
    "Referenced reference key is missing in references record.",
  );
export type LTPMixture = output<typeof LTPMixture>;
