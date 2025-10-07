// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { annotateMixture } from "@/shared/annotate-mixture";
import { reference2bibliography } from "@/shared/cite";
import { mapObject } from "@/shared/utils";
import { convertMixture } from "@lxcat/converter";
import { LTPMixture } from "@lxcat/schema";

export const toLegacyAction = async (mixture: LTPMixture) => {
  const references = mapObject(
    mixture.references,
    ([key, reference]) => [key, reference2bibliography(reference)],
  );

  const data = annotateMixture(mixture);
  data.references = references;

  return convertMixture(data);
};
