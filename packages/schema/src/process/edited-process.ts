// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { object, output, ZodType, ZodTypeAny } from "zod";
import { Key } from "../key.js";
import { ProcessInfo } from "./process-info.js";
import { Process } from "./process.js";

export const EditedProcess = <
  StateType extends ZodTypeAny,
  ReferenceType extends ZodTypeAny,
>(StateType: StateType, ReferenceType: ReferenceType) =>
  Process(
    StateType,
    ProcessInfo(ReferenceType, object({ _key: Key.optional() })),
  );

type EditedProcessType<
  StateType extends ZodTypeAny,
  ReferenceType extends ZodTypeAny,
> = ReturnType<typeof EditedProcess<StateType, ReferenceType>>;

export type EditedProcess<StateType, ReferenceType> = output<
  EditedProcessType<ZodType<StateType>, ZodType<ReferenceType>>
>;
