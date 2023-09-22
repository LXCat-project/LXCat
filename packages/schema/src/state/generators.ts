// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { UnknownKeysParam, z, ZodObject, ZodRawShape, ZodTypeAny } from "zod";
import { type Component } from "./component";

export const typeTag = <Tag extends string>(tag: Tag) =>
  z.object({ type: z.literal(tag) });

export const makeMoleculeSchema = <
  Tag extends string,
  Shape extends ZodRawShape,
  UnknownKeys extends UnknownKeysParam,
  Catchall extends ZodTypeAny,
  ElectronicSchema extends z.ZodTypeAny,
  VibrationalSchema extends z.ZodTypeAny,
  RotationalSchema extends z.ZodTypeAny,
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
      z.object({
        electronic: z.union([
          z.intersection(
            electronic,
            z.object({
              vibrational: z.optional(
                z.union([
                  z.intersection(
                    vibrational,
                    z.object({
                      rotational: z.optional(
                        z.union([
                          rotational.describe("Singular"),
                          z.array(z.union([rotational, z.string()]))
                            .describe("Compound"),
                          z.string().describe("Unspecified"),
                        ]),
                      ),
                    }),
                  ).describe("Singular"),
                  z.array(z.union([vibrational, z.string()]))
                    .describe("Compound"),
                  z.string().describe("Unspecified"),
                ]),
              ),
            }),
          ).describe("Singular"),
          z.array(electronic).describe("Compound"),
        ]),
      }),
    );

export const makeMolecule = <
  Tag extends string,
  Shape extends ZodRawShape,
  UnknownKeys extends UnknownKeysParam,
  Catchall extends ZodTypeAny,
  ElectronicSchema extends z.ZodTypeAny,
  VibrationalSchema extends z.ZodTypeAny,
  RotationalSchema extends z.ZodTypeAny,
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
  ElectronicSchema extends z.ZodTypeAny,
>(
  tag: Tag,
  composition: ZodObject<Shape, UnknownKeys, Catchall>,
  electronic: ElectronicSchema,
) =>
  typeTag(tag).merge(composition).merge(
    z.object({
      electronic: z.union([
        electronic.describe("Singular"),
        z.array(electronic).describe("Compound"),
      ]),
    }),
  );

export const makeAtom = <
  Tag extends string,
  Shape extends ZodRawShape,
  UnknownKeys extends UnknownKeysParam,
  Catchall extends ZodTypeAny,
  ElectronicSchema extends z.ZodTypeAny,
>(
  tag: Tag,
  composition: ZodObject<Shape, UnknownKeys, Catchall>,
  electronic: Component<ElectronicSchema>,
) => ({
  plain: makeAtomSchema(tag, composition, electronic.innerType()),
  serializable: makeAtomSchema(tag, composition, electronic),
});
