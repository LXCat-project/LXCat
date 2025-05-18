// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { object, output, string } from "zod";

// TODO: These should be urls, but zod v4 currently does not support
//       localhost:port type urls.
export const SelfReference = object({
  $schema: string(),
  url: string().describe("URL used to download this dataset."),
  termsOfUse: string().describe(
    "URL to the terms of use that have been accepted to download this dataset",
  ),
});
export type SelfReference = output<typeof SelfReference>;
