// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { annotateMixture } from "@/shared/annotate-mixture";
import { formatReference } from "@/citation/cite";
import { convertMixture } from "@/shared/native-converter";
import { LTPMixture } from "@lxcat/schema";

export const toLegacyAction = async (mixture: LTPMixture) => {
  const references = await formatReference(mixture.references);

  const data = annotateMixture(mixture);
  data.references = references;

  return convertMixture(data);
};
