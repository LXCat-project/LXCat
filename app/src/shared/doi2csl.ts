// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Cite } from "@citation-js/core";
import "@citation-js/plugin-doi";

// TODO write unit test that mocks fetch to Internet
export async function doi2csl(doi: string) {
  const cite = await Cite.async(doi, {
    forceType: "@doi/id",
  });
  const ref = cite.data[0];
  return ref;
}
