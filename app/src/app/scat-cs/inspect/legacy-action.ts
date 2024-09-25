// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { reference2bibliography } from "@/shared/cite";
import { mapObject } from "@/shared/utils";
import { convertMixture } from "@lxcat/converter";
import { LTPMixture, LTPMixtureWithReference } from "@lxcat/schema";

export const toLegacyAction = async (mixture: LTPMixture) => {
  const references = mapObject(
    mixture.references,
    ([key, reference]) => [key, reference2bibliography(reference)],
  );

  const ids = mixture
    .processes
    .flatMap((process) => process.info)
    .map((info) => info._key);

  const data: LTPMixtureWithReference = {
    $schema: `${process.env.NEXT_PUBLIC_URL}/scat-css/LTPMixture`,
    url: `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${ids.join(",")}`,
    termsOfUse: `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${
      ids.join(",")
    }#termsOfUse`,
    ...mixture,
    references,
  };

  return convertMixture(data);
};
