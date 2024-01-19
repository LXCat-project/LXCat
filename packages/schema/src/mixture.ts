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
import { Key } from "./key.js";
import { ProcessInfo } from "./process/process-info.js";
import { Process } from "./process/process.js";
import { SetReference } from "./process/set-reference.js";
import { SelfReference } from "./self-reference.js";
import { SetHeader } from "./set-header.js";
import { SerializedSpecies } from "./species/serialized.js";
import { VersionInfo } from "./version-info.js";
import { versioned } from "./versioned.js";

// HEAD
const MixtureBody = <ReferenceType extends ZodTypeAny>(
  Reference: ReferenceType,
) =>
  // HEAD
  object({
    sets: record(versioned(SetHeader(Contributor))),
    references: record(Reference),
    states: record(SerializedSpecies),
    processes: array(
      // TODO: An intersection type usually does not generate the best JSON schemas. See if there is a
      //       better way to model process data with set references.
      Process(
        string(),
        object({ _key: Key, versionInfo: VersionInfo }).and(
          ProcessInfo(ReferenceRef(string().min(1))),
        ).and(
          SetReference,
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
export type LTPMixture = TypeOf<typeof LTPMixture>;

export const LTPMixtureWithReference = intersection(
  SelfReference,
  MixtureBody(Reference.or(string().min(1))),
);
export type LTPMixtureWithReference = TypeOf<typeof LTPMixtureWithReference>;
