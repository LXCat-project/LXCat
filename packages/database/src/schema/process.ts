// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Reference, SetHeader } from "@lxcat/schema";
import { Process, ProcessInfo } from "@lxcat/schema/process";
import { array, object, TypeOf, ZodType, ZodTypeAny } from "zod";
import { Keyed } from "./key.js";
import { SerializedSpecies } from "./species.js";

export const KeyedProcess = <
  StateType extends ZodTypeAny,
  ReferenceType extends ZodTypeAny,
>(StateType: StateType, ReferenceType: ReferenceType) =>
  Process(StateType, Keyed(ProcessInfo(ReferenceType)));

type KeyedProcessType<
  StateType extends ZodTypeAny,
  ReferenceType extends ZodTypeAny,
> = ReturnType<typeof KeyedProcess<StateType, ReferenceType>>;

export type KeyedProcess<StateType, ReferenceType> = TypeOf<
  KeyedProcessType<ZodType<StateType>, ZodType<ReferenceType>>
>;

// TODO: Should also include versioning information.
export const OwnedProcess = Process(
  SerializedSpecies,
  Keyed(
    ProcessInfo(Reference)
      .merge(object({ isPartOf: array(Keyed(SetHeader)) })),
  ),
);
export type OwnedProcess = TypeOf<typeof OwnedProcess>;
