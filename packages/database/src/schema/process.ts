// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Keyed, Reference, SetHeader, versioned } from "@lxcat/schema";
import { Process, ProcessInfo } from "@lxcat/schema/process";
import { SerializedSpecies } from "@lxcat/schema/species";
import { array, object, output, string, ZodType } from "zod";

export const KeyedProcess = <
  StateType extends ZodType,
  ReferenceType extends ZodType,
>(StateType: StateType, ReferenceType: ReferenceType) =>
  Process(StateType, Keyed(ProcessInfo(ReferenceType)));

type KeyedProcessType<
  StateType extends ZodType,
  ReferenceType extends ZodType,
> = ReturnType<typeof KeyedProcess<StateType, ReferenceType>>;

export type KeyedProcess<StateType, ReferenceType> = output<
  KeyedProcessType<ZodType<StateType>, ZodType<ReferenceType>>
>;

export const OwnedProcess = Process(
  SerializedSpecies,
  versioned(
    ProcessInfo(Reference)
      .merge(object({ isPartOf: array(Keyed(SetHeader(string().min(1)))) })),
  ),
);
export type OwnedProcess = output<typeof OwnedProcess>;
