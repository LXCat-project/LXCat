import { output, ZodEffects, ZodTypeAny } from "zod";

type Serializable = {
  summary: () => string;
  latex: () => string;
};

export type Component<ComponentSchema extends ZodTypeAny> = ZodEffects<
  ComponentSchema,
  output<ComponentSchema> & Serializable
>;

export const makeComponent = <ComponentSchema extends ZodTypeAny>(
  schema: ComponentSchema,
  summary: (object: output<ComponentSchema>) => string,
  latex: (object: output<ComponentSchema>) => string,
): Component<ComponentSchema> =>
  schema.transform((object) => ({
    ...object,
    summary: () => summary(object),
    latex: () => latex(object),
  }));
