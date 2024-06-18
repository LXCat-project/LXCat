// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, object, record, string, TypeOf } from "zod";
import { Reference, ReferenceRef } from "./common/reference.js";
import { partialKeyed } from "./partial-keyed.js";
import { EditedProcess } from "./process/edited-process.js";
import { SetHeader } from "./set-header.js";
import { AnySpecies } from "./species/any-species.js";

const EditedDocumentBody = object({
  references: record(Reference),
  states: record(AnySpecies),
  processes: array(
    EditedProcess(string(), ReferenceRef(string().min(1))),
  ),
});

// Optionally contains _key information, version information can be omitted.
// This type can be used to update existing documents.
export const EditedLTPDocument = partialKeyed(
  EditedDocumentBody.merge(SetHeader(string().min(1))),
)
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

export type EditedLTPDocument = TypeOf<typeof EditedLTPDocument>;
