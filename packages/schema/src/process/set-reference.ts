// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { array, object, string } from "zod";

export const SetReference = object({
  isPartOf: array(string()),
});
