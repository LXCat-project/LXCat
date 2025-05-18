// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { output, ZodPipe, ZodTransform, ZodType } from "zod";

type Serializable = {
  summary: () => string;
  latex: () => string;
};

export type Component<ComponentSchema extends ZodType> = ZodPipe<
  ComponentSchema,
  ZodTransform<
    output<ComponentSchema> & Serializable,
    output<ComponentSchema>
  >
>;

export const makeComponent = <ComponentSchema extends ZodType>(
  schema: ComponentSchema,
  summary: (object: output<ComponentSchema>) => string,
  latex: (object: output<ComponentSchema>) => string,
): Component<ComponentSchema> =>
  schema.transform((object) => ({
    ...object,
    summary: () => summary(object),
    latex: () => latex(object),
  }));
