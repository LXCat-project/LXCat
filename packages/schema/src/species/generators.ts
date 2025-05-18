// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import {
  array,
  intersection,
  literal,
  object,
  optional,
  string,
  union,
  ZodObject,
  ZodRawShape,
  ZodType,
} from "zod";
import { type Component } from "./component.js";

export const typeTag = <Tag extends string>(tag: Tag) =>
  object({ type: literal(tag) });

export const makeMoleculeSchema = <
  Tag extends string,
  Shape extends ZodRawShape,
  InExtra extends Record<string, unknown>,
  OutExtra extends Record<string, unknown>,
  ElectronicSchema extends ZodType,
  VibrationalSchema extends ZodType,
  RotationalSchema extends ZodType,
>(
  tag: Tag,
  composition: ZodObject<Shape, InExtra, OutExtra>,
  electronic: ElectronicSchema,
  vibrational: VibrationalSchema,
  rotational: RotationalSchema,
) =>
  object({
    ...typeTag(tag).shape,
    ...composition.shape,
    electronic: optional(
      union([
        intersection(
          electronic,
          object({
            vibrational: optional(
              union([
                intersection(
                  vibrational,
                  object({
                    rotational: optional(
                      union([
                        rotational.describe("Singular"),
                        array(
                          union([
                            rotational.describe("Singular"),
                            string().describe("Unspecified"),
                          ]),
                        )
                          .min(2)
                          .describe("Compound"),
                        string().describe("Unspecified"),
                      ]),
                    ),
                  }),
                ).describe("Singular"),
                array(
                  union([
                    vibrational.describe("Singular"),
                    string().describe("Unspecified"),
                  ]),
                )
                  .min(2)
                  .describe("Compound"),
                string().describe("Unspecified"),
              ]),
            ),
          }),
        ).describe("Singular"),
        array(electronic).min(2).describe("Compound"),
        string().min(1).describe("Unspecified"),
      ]),
    ),
  });

export const makeMolecule = <
  Tag extends string,
  Shape extends ZodRawShape,
  InExtra extends Record<string, unknown>,
  OutExtra extends Record<string, unknown>,
  ElectronicSchema extends ZodType,
  VibrationalSchema extends ZodType,
  RotationalSchema extends ZodType,
>(
  tag: Tag,
  composition: ZodObject<Shape, InExtra, OutExtra>,
  electronic: Component<ElectronicSchema>,
  vibrational: Component<VibrationalSchema>,
  rotational: Component<RotationalSchema>,
) => ({
  plain: makeMoleculeSchema(
    tag,
    composition,
    electronic.in,
    vibrational.in,
    rotational.in,
  ),
  serializable: makeMoleculeSchema(
    tag,
    composition,
    electronic,
    vibrational,
    rotational,
  ),
});

export const makeAtomSchema = <
  Tag extends string,
  Shape extends ZodRawShape,
  InExtra extends Record<string, unknown>,
  OutExtra extends Record<string, unknown>,
  ElectronicSchema extends ZodType,
>(
  tag: Tag,
  composition: ZodObject<Shape, InExtra, OutExtra>,
  electronic: ElectronicSchema,
) =>
  object({
    ...typeTag(tag).shape,
    ...composition.shape,
    electronic: union([
      electronic.describe("Singular"),
      array(electronic).min(2).describe("Compound"),
    ]),
  });

export const makeAtom = <
  Tag extends string,
  Shape extends ZodRawShape,
  InExtra extends Record<string, unknown>,
  OutExtra extends Record<string, unknown>,
  ElectronicSchema extends ZodType,
>(
  tag: Tag,
  composition: ZodObject<Shape, InExtra, OutExtra>,
  electronic: Component<ElectronicSchema>,
) => ({
  plain: makeAtomSchema(tag, composition, electronic.in),
  serializable: makeAtomSchema(tag, composition, electronic),
});
