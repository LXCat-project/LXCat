import { Reference, SetHeader } from "@lxcat/schema";
import { Process, ProcessInfo } from "@lxcat/schema/process";
import { array, object, TypeOf, ZodType, ZodTypeAny } from "zod";
import { Keyed } from "./key";
import { SerializedSpecies } from "./species";

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

export const OwnedProcess = Process(
  SerializedSpecies,
  Keyed(
    ProcessInfo(Reference)
      .merge(object({ isPartOf: array(Keyed(SetHeader)) })),
  ),
);
export type OwnedProcess = TypeOf<typeof OwnedProcess>;
