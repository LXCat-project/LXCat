// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { Reference } from "./common/reference";
import { AnyProcess } from "./process";
import { AnySpecies } from "./species";

export const SelfReference = z.object({
  $schema: z.string().url(),
  url: z.string().url().describe("URL used to download this dataset."),
  termsOfUse: z.string().url().describe(
    "URL to the terms of use that have been accepted to download this dataset",
  ),
});
export type SelfReference = z.infer<typeof SelfReference>;

export const SetHeader = z.object({
  contributor: z.string().min(1),
  name: z.string().min(1),
  publishedIn: z.string().describe(
    "A key into the `references` dict. This is a reference to the paper that presents this dataset.",
  ).optional(),
  description: z.string().describe("A description of this dataset."),
  complete: z.boolean(),
});

// TODO: Add a `refine` that checks whether the referenced state and reference
//       keys actually exist in the respective objects.
const DocumentBody = z.object({
  references: z.record(Reference),
  states: z.record(AnySpecies),
  processes: z.array(AnyProcess(z.string(), z.string())),
});

export const LTPDocument = SelfReference
  .merge(SetHeader)
  .merge(DocumentBody)
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

export type LTPDocument = z.output<typeof LTPDocument>;
