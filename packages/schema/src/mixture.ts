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
import { ProcessInfo } from "./process/process-info.js";
import { Process } from "./process/process.js";
import { SetReference } from "./process/set-reference.js";
import { SelfReference } from "./self-reference.js";
import { SetHeader } from "./set-header.js";
import { SerializedSpecies } from "./species/serialized.js";
import { versioned } from "./versioned.js";

const MixtureBody = <ReferenceType extends ZodType>(
  Reference: ReferenceType,
) =>
  object({
    sets: record(string(), versioned(SetHeader(Contributor))),
    references: record(string(), Reference),
    states: record(string(), SerializedSpecies),
    processes: array(
      Process(
        string(),
        versioned(
          object({
            ...ProcessInfo(ReferenceRef(string().min(1))).shape,
            ...SetReference.shape,
          }),
        ),
      ),
    ),
  })
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

export const LTPMixture = MixtureBody(Reference);
export type LTPMixture = output<typeof LTPMixture>;

export const LTPMixtureWithReference = intersection(
  SelfReference,
  MixtureBody(Reference.or(string().min(1))),
);
export type LTPMixtureWithReference = output<typeof LTPMixtureWithReference>;
