// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, object, record, string, TypeOf, ZodIssueCode } from "zod";
import { Reference, ReferenceRef } from "./common/reference.js";
import { NewProcess } from "./process/new-process.js";
import { SetHeader } from "./set-header.js";
import { AnySpecies } from "./species/any-species.js";

const NewDocumentBody = object({
  references: record(Reference),
  states: record(AnySpecies),
  processes: array(NewProcess(string(), ReferenceRef(string().min(1)))),
});

// Does not contain any _key or version information. Fresh datasets that are
// uploaded by contributors use this type.
export const NewLTPDocument = NewDocumentBody
  .merge(SetHeader(string().min(1)))
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

export type NewLTPDocument = TypeOf<typeof NewLTPDocument>;
