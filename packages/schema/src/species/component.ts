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
    // NOTE: We are cheating the type system a little here. We need this because
    //       the `Unspecified` types provide `string` components instead of
    //       objects. TypeScript only allows to extend object types, but in
    //       pure JavaScript extending a string object with a method is legal.
    //       Therefore, this will work at runtime, but we need this any cast to
    //       make it transpile.
    // eslint-disable-next-line
    ...object as any,
    summary: () => summary(object),
    latex: () => latex(object),
  }));
