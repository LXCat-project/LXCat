// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, object, output, record, string } from "zod";
import { Reference, ReferenceRef } from "./common/reference.js";
import { NewProcess } from "./process/new-process.js";
import { SetHeader } from "./set-header.js";
import { AnySpecies } from "./species/any-species.js";

const NewDocumentBody = object({
  references: record(string(), Reference),
  states: record(string(), AnySpecies),
  processes: array(NewProcess(string(), ReferenceRef(string().min(1)))),
});

// Does not contain any _key or version information. Fresh datasets that are
// uploaded by contributors use this type.
export const NewLTPDocument = object({
  ...NewDocumentBody.shape,
  ...SetHeader(string().min(1)).shape,
}).check((ctx) => {
  const checkState = (key: string) => {
    const valid = key in ctx.value.states;

    if (!valid) {
      ctx.issues.push({
        code: "custom",
        input: key,
        message:
          `Referenced state key (${key}) is missing in the states record.`,
      });
    }
  };

  ctx.value.processes
    .flatMap((process) => process.reaction.lhs)
    .forEach(({ state }) => checkState(state));
  ctx.value.processes
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

export type NewLTPDocument = output<typeof NewLTPDocument>;
