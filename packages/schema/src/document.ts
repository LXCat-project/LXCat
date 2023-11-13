// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { Reference } from "./common/reference";
import { AnyProcess } from "./process";
import { SelfReference } from "./self-reference";
import { SetHeader } from "./set-header";
import { AnySpecies } from "./species";

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
