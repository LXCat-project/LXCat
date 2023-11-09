import { array, object, ZodTypeAny } from "zod";
import { Reaction } from "./reaction";

export const Process = <
  StateType extends ZodTypeAny,
  ProcessInfoType extends ZodTypeAny,
>(StateType: StateType, ProcessInfoType: ProcessInfoType) =>
  object({
    reaction: Reaction(StateType),
    info: array(ProcessInfoType),
  });
