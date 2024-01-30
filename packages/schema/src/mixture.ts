// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { output, z } from "zod";
import { Reference, ReferenceRef } from "./common/reference.js";
import { ProcessInfo } from "./process/process-info.js";
import { Process } from "./process/process.js";
import { SetReference } from "./process/set-reference.js";
import { SelfReference } from "./self-reference.js";
import { SetHeader } from "./set-header.js";
import { AnySpecies } from "./species/any-species.js";

const MixtureBody = z.object({
  sets: z.record(SetHeader),
  references: z.record(Reference),
  states: z.record(AnySpecies),
  processes: z.array(
    Process(
      z.string(),
      ProcessInfo(ReferenceRef(z.string().min(1))).merge(SetReference),
    ),
  ),
});

export const LTPMixture = MixtureBody
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
        .flatMap(({ info }) => info)
        .flatMap(({ references }) => references)
        .every((reference) =>
          typeof reference === "string"
            ? reference in doc.references
            : reference.id in doc.references
        ),
    "Referenced reference key is missing in references record.",
  );
export type LTPMixture = output<typeof LTPMixture>;

export const LTPMixtureWithReference = z.intersection(
  SelfReference,
  LTPMixture,
);
export type LTPMixtureWithReference = output<typeof LTPMixtureWithReference>;
