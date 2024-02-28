// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { Reference, ReferenceRef } from "./common/reference.js";
import { Contributor } from "./contributor.js";
import { VersionedProcess } from "./process/versioned-process.js";
import { SelfReference } from "./self-reference.js";
import { SetHeader } from "./set-header.js";
import { AnySpecies } from "./species/any-species.js";
import { versioned } from "./versioned.js";

const VersionedDocumentBody = z.object({
  references: z.record(Reference),
  states: z.record(AnySpecies),
  processes: z.array(
    versioned(VersionedProcess(z.string(), ReferenceRef(z.string().min(1)))),
  ),
});

// Contains _key and version information. Datasets downloaded from LXCat use
// this schema.
export const VersionedLTPDocument = versioned(
  SelfReference.merge(SetHeader(Contributor)).merge(VersionedDocumentBody),
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

export type EditedLTPDocument = z.output<typeof VersionedLTPDocument>;
