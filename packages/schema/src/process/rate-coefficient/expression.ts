import { array, globalRegistry, literal, object, output, string } from "zod";

export const Expression = object({
  type: literal("Expression"),
  expression: string().min(1),
  unit: string().min(1),
  parameters: array(string().min(1)),
});
export type Expression = output<typeof Expression>;

globalRegistry.add(Expression, { id: "Expression" });
