// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { string, z } from "zod";
import { Reference, ReferenceRef } from "./common/reference.js";
import { NewProcess } from "./process/new-process.js";
import { SetHeader } from "./set-header.js";
import { AnySpecies } from "./species/any-species.js";

const NewDocumentBody = z.object({
  references: z.record(Reference),
  states: z.record(AnySpecies),
  processes: z.array(NewProcess(z.string(), ReferenceRef(z.string().min(1)))),
});

// Does not contain any _key or version information. Fresh datasets that are
// uploaded by contributors use this type.
export const NewLTPDocument = NewDocumentBody
  .merge(SetHeader(string().min(1)))
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

export type NewLTPDocument = z.output<typeof NewLTPDocument>;
