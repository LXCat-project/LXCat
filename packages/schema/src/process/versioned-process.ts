// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { output, ZodType, ZodTypeAny } from "zod";
import { versioned } from "../versioned.js";
import { ProcessInfo } from "./process-info.js";
import { Process } from "./process.js";

export const VersionedProcess = <
  StateType extends ZodTypeAny,
  ReferenceType extends ZodTypeAny,
>(StateType: StateType, ReferenceType: ReferenceType) =>
  Process(StateType, versioned(ProcessInfo(ReferenceType)));

type VersionedProcessType<
  StateType extends ZodTypeAny,
  ReferenceType extends ZodTypeAny,
> = ReturnType<typeof VersionedProcess<StateType, ReferenceType>>;

export type VersionedProcess<StateType, ReferenceType> = output<
  VersionedProcessType<ZodType<StateType>, ZodType<ReferenceType>>
>;
