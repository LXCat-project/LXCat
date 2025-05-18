// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, object, output, record, string } from "zod";
import { Reference, ReferenceRef } from "./common/reference.js";
import { PartialKeyed } from "./partial-keyed.js";
import { EditedProcess } from "./process/edited-process.js";
import { SetHeader } from "./set-header.js";
import { AnySpecies } from "./species/any-species.js";

const EditedDocumentBody = object({
  references: record(string(), Reference),
  states: record(string(), AnySpecies),
  processes: array(
    EditedProcess(string(), ReferenceRef(string().min(1))),
  ),
});

// Optionally contains _key information, version information can be omitted.
// This type can be used to update existing documents.
export const EditedLTPDocument = PartialKeyed(
  object({ ...EditedDocumentBody.shape, ...SetHeader(string().min(1)).shape }),
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

export type EditedLTPDocument = output<typeof EditedLTPDocument>;
