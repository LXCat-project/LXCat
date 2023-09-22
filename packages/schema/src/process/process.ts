import { object, ZodTypeAny } from "zod";
import { OneOrMultiple } from "../common/util";
import { Reaction } from "./reaction";

export const Process = <
  StateType extends ZodTypeAny,
  ProcessInfoType extends ZodTypeAny,
>(StateType: StateType, ProcessInfoType: ProcessInfoType) =>
  object({
    reaction: Reaction(StateType),
    info: OneOrMultiple(ProcessInfoType),
  });
