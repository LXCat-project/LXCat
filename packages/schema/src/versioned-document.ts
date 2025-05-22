// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import {
  array,
  intersection,
  object,
  output,
  record,
  string,
  ZodType,
} from "zod";
import { Reference, ReferenceRef } from "./common/reference.js";
import { Contributor } from "./contributor.js";
import { VersionedProcess } from "./process/versioned-process.js";
import { SelfReference } from "./self-reference.js";
import { SetHeader } from "./set-header.js";
import { SerializedSpecies } from "./species/serialized.js";
import { versioned } from "./versioned.js";

export const VersionedDocumentBody = <
  SpeciesType extends ZodType,
  ReferenceType extends ZodType,
>(
  Species: SpeciesType,
  Reference: ReferenceType,
) =>
  versioned(
    object({
      ...SetHeader(Contributor).shape,
      references: record(string(), Reference),
      states: record(string(), Species),
      processes: array(
        VersionedProcess(string(), ReferenceRef(string().min(1))),
      ),
    }),
  )
    .check((ctx) => {
      const doc = ctx.value;

      const checkState = (key: string) => {
        const valid = key in doc.states;

        if (!valid) {
          ctx.issues.push({
            code: "custom",
            input: key,
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
    }, (ctx) =>
      ctx.value.processes
        .flatMap(({ info }) => info)
        .flatMap(({ references }) => references)
        .forEach((reference) => {
          const key = typeof reference === "string" ? reference : reference.id;
          const valid = key in ctx.value.references;

          if (!valid) {
            ctx.issues.push({
              code: "custom",
              input: reference,
              message:
                `Referenced reference key (${key}) is missing in the references record.`,
            });
          }
        }));

// Contains _key and version information. Datasets downloaded from LXCat use
// this schema.
export const VersionedLTPDocument = VersionedDocumentBody(
  SerializedSpecies,
  Reference,
);
export type VersionedLTPDocument = output<typeof VersionedLTPDocument>;

export const VersionedLTPDocumentWithReference = intersection(
  SelfReference,
  VersionedDocumentBody(SerializedSpecies, Reference.or(string().min(1))),
);
export type VersionedLTPDocumentWithReference = output<
  typeof VersionedLTPDocumentWithReference
>;
