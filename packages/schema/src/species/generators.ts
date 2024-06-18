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
  UnknownKeysParam,
  ZodObject,
  ZodRawShape,
  ZodTypeAny,
} from "zod";
import { type Component } from "./component.js";

export const typeTag = <Tag extends string>(tag: Tag) =>
  object({ type: literal(tag) });

export const makeMoleculeSchema = <
  Tag extends string,
  Shape extends ZodRawShape,
  UnknownKeys extends UnknownKeysParam,
  Catchall extends ZodTypeAny,
  ElectronicSchema extends ZodTypeAny,
  VibrationalSchema extends ZodTypeAny,
  RotationalSchema extends ZodTypeAny,
>(
  tag: Tag,
  composition: ZodObject<Shape, UnknownKeys, Catchall>,
  electronic: ElectronicSchema,
  vibrational: VibrationalSchema,
  rotational: RotationalSchema,
) =>
  typeTag(tag)
    .merge(composition)
    .merge(
      object({
        electronic: union([
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
        ]),
      }),
    );

export const makeMolecule = <
  Tag extends string,
  Shape extends ZodRawShape,
  UnknownKeys extends UnknownKeysParam,
  Catchall extends ZodTypeAny,
  ElectronicSchema extends ZodTypeAny,
  VibrationalSchema extends ZodTypeAny,
  RotationalSchema extends ZodTypeAny,
>(
  tag: Tag,
  composition: ZodObject<Shape, UnknownKeys, Catchall>,
  electronic: Component<ElectronicSchema>,
  vibrational: Component<VibrationalSchema>,
  rotational: Component<RotationalSchema>,
) => ({
  plain: makeMoleculeSchema(
    tag,
    composition,
    electronic.innerType(),
    vibrational.innerType(),
    rotational.innerType(),
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
  UnknownKeys extends UnknownKeysParam,
  Catchall extends ZodTypeAny,
  ElectronicSchema extends ZodTypeAny,
>(
  tag: Tag,
  composition: ZodObject<Shape, UnknownKeys, Catchall>,
  electronic: ElectronicSchema,
) =>
  typeTag(tag).merge(composition).merge(
    object({
      electronic: union([
        electronic.describe("Singular"),
        array(electronic).min(2).describe("Compound"),
      ]),
    }),
  );

export const makeAtom = <
  Tag extends string,
  Shape extends ZodRawShape,
  UnknownKeys extends UnknownKeysParam,
  Catchall extends ZodTypeAny,
  ElectronicSchema extends ZodTypeAny,
>(
  tag: Tag,
  composition: ZodObject<Shape, UnknownKeys, Catchall>,
  electronic: Component<ElectronicSchema>,
) => ({
  plain: makeAtomSchema(tag, composition, electronic.innerType()),
  serializable: makeAtomSchema(tag, composition, electronic),
});
