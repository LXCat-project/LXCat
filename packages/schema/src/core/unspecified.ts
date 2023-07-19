// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { TypeTag } from "./generators";

export type Unspecified =
  & TypeTag<"unspecified">
  & { electronic: string };
