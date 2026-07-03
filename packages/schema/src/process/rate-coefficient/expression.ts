import { array, literal, object, output, string } from "zod";
import { registerType } from "../../common/util.js";

export const Expression = object({
  type: literal("Expression"),
  expression: string().min(1),
  unit: string().min(1),
  parameters: array(string().min(1)),
});
export type Expression = output<typeof Expression>;

registerType(Expression, { id: "Expression" });
