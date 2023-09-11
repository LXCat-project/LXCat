import { AnyProcess } from "@lxcat/schema/dist/process";
import { output, ZodType, ZodTypeAny } from "zod";

import { Keyed } from "./key";

export const KeyedProcess = <
  StateType extends ZodTypeAny,
  ReferenceType extends ZodTypeAny,
>(StateType: StateType, ReferenceType: ReferenceType) =>
  Keyed(AnyProcess(StateType, ReferenceType));

type KeyedProcessType<
  StateType extends ZodTypeAny,
  ReferenceType extends ZodTypeAny,
> = ReturnType<typeof KeyedProcess<StateType, ReferenceType>>;

export type KeyedProcess<StateType, ReferenceType> = output<
  KeyedProcessType<ZodType<StateType>, ZodType<ReferenceType>>
>;
