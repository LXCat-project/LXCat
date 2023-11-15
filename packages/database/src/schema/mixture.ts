// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Reference, SelfReference, SetHeader } from "@lxcat/schema";
import { array, object, output, record, string } from "zod";

import { Process, ProcessInfo, SetReference } from "@lxcat/schema/process";
import { Keyed } from "./key.js";
import { SerializedSpecies } from "./species.js";

const KeyedMixtureBody = object({
  sets: record(Keyed(SetHeader)),
  references: record(Reference),
  states: record(SerializedSpecies),
  processes: array(
    Process(string(), Keyed(ProcessInfo(string()).merge(SetReference))),
  ),
});

export const KeyedLTPMixture = KeyedMixtureBody;
export type KeyedLTPMixture = output<typeof KeyedLTPMixture>;

export const KeyedLTPMixtureReferenceable = KeyedMixtureBody.merge(
  SelfReference,
);
export type KeyedLTPMixtureReferenceable = output<
  typeof KeyedLTPMixtureReferenceable
>;
