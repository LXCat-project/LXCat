// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LTPMixture, LTPMixtureWithReference } from "@lxcat/schema";

export const annotateMixture = (data: LTPMixture): LTPMixtureWithReference => {
  const ids = data
    .processes
    .flatMap((process) => process.info)
    .map((info) => info._key);

  return ({
    $schema: `${process.env.NEXT_PUBLIC_URL}/scat-css/LTPMixture`,
    url: `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${ids.join(",")}`,
    termsOfUse: `${process.env.NEXT_PUBLIC_URL}/scat-cs/inspect?ids=${
      ids.join(",")
    }&termsOfUse=true`,
    ...data,
  });
};
