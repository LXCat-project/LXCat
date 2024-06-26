// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import {
  array,
  intersection,
  object,
  record,
  string,
  TypeOf,
  ZodTypeAny,
} from "zod";
import { Reference, ReferenceRef } from "./common/reference.js";
import { Contributor } from "./contributor.js";
import { VersionedProcess } from "./process/versioned-process.js";
import { SelfReference } from "./self-reference.js";
import { SetHeader } from "./set-header.js";
import { AnySpecies } from "./species/any-species.js";
import { versioned } from "./versioned.js";

const VersionedDocumentBody = <ReferenceType extends ZodTypeAny>(
  Reference: ReferenceType,
) =>
  versioned(
    SetHeader(Contributor).merge(
      object({
        references: record(Reference),
        states: record(AnySpecies),
        processes: array(
          VersionedProcess(string(), ReferenceRef(string().min(1))),
        ),
      }),
    ),
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

// Contains _key and version information. Datasets downloaded from LXCat use
// this schema.
export const VersionedLTPDocument = VersionedDocumentBody(Reference);
export type VersionedLTPDocument = TypeOf<typeof VersionedLTPDocument>;

export const VersionedLTPDocumentWithReference = intersection(
  SelfReference,
  VersionedDocumentBody(Reference.or(string().min(1))),
);
export type VersionedLTPDocumentWithReference = TypeOf<
  typeof VersionedLTPDocumentWithReference
>;
