// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { boolean, object, output, string, ZodType } from "zod";

export const SetHeader = <ContributorType extends ZodType>(
  contributor: ContributorType,
) =>
  object({
    contributor,
    name: string().min(1),
    publishedIn: string().describe(
      "A key into the `references` dict. This is a reference to the paper that presents this dataset.",
    ).optional(),
    description: string().describe("A description of this dataset."),
    complete: boolean(),
  });

type SetHeaderInfoType<ReferenceType extends ZodType> = ReturnType<
  typeof SetHeader<ReferenceType>
>;

export type SetHeader<ReferenceType> = output<
  SetHeaderInfoType<ZodType<ReferenceType>>
>;
