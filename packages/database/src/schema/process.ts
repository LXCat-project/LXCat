import { Process, ProcessInfo } from "@lxcat/schema/process";
import { output, ZodType, ZodTypeAny } from "zod";
import { Keyed } from "./key";

export const KeyedProcess = <
  StateType extends ZodTypeAny,
  ReferenceType extends ZodTypeAny,
>(StateType: StateType, ReferenceType: ReferenceType) =>
  Process(StateType, Keyed(ProcessInfo(ReferenceType)));

type KeyedProcessType<
  StateType extends ZodTypeAny,
  ReferenceType extends ZodTypeAny,
> = ReturnType<typeof KeyedProcess<StateType, ReferenceType>>;

export type KeyedProcess<StateType, ReferenceType> = output<
  KeyedProcessType<ZodType<StateType>, ZodType<ReferenceType>>
>;
