// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Key, Reference, SetHeader, versioned } from "@lxcat/schema";
import { Process, ProcessInfo } from "@lxcat/schema/process";
import { SerializedSpecies } from "@lxcat/schema/species";
import { array, object, string, TypeOf, ZodType, ZodTypeAny } from "zod";
import { Keyed } from "./key.js";

export const KeyedProcess = <
  StateType extends ZodTypeAny,
  ReferenceType extends ZodTypeAny,
>(StateType: StateType, ReferenceType: ReferenceType) =>
  Process(StateType, ProcessInfo(ReferenceType, object({ _key: Key })));

type KeyedProcessType<
  StateType extends ZodTypeAny,
  ReferenceType extends ZodTypeAny,
> = ReturnType<typeof KeyedProcess<StateType, ReferenceType>>;

export type KeyedProcess<StateType, ReferenceType> = TypeOf<
  KeyedProcessType<ZodType<StateType>, ZodType<ReferenceType>>
>;

export const OwnedProcess = Process(
  SerializedSpecies,
  ProcessInfo(
    Reference,
    versioned(object({ isPartOf: array(Keyed(SetHeader(string().min(1)))) })),
  ),
);
export type OwnedProcess = TypeOf<typeof OwnedProcess>;
