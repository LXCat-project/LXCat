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
  ZodIssueCode,
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
    .superRefine((doc, ctx) => {
      const checkState = (key: string) => {
        const valid = key in doc.states;

        if (!valid) {
          ctx.addIssue({
            code: ZodIssueCode.custom,
            message:
              `Referenced state key (${key}) is missing in the states record.`,
          });
        }
      };

      doc.processes
        .flatMap((process) => process.reaction.lhs)
        .forEach(({ state }) => checkState(state));
      doc.processes
        .flatMap((process) => process.reaction.rhs)
        .every(({ state }) => checkState(state));
    })
    .superRefine((doc, ctx) =>
      doc.processes
        .flatMap(({ info }) => info)
        .flatMap(({ references }) => references)
        .forEach((reference) => {
          const key = typeof reference === "string" ? reference : reference.id;
          const valid = key in doc.references;

          if (!valid) {
            ctx.addIssue({
              code: ZodIssueCode.custom,
              message:
                `Referenced reference key (${key}) is missing in the references record.`,
            });
          }
        })
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
