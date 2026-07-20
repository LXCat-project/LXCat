// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "server-only";

import { Reference } from "@lxcat/schema";
import { reference2bibliography } from "./cite";

export interface FormattedReference {
  id: string;
  ref: string;
  url?: string;
}

export const formatReference = (
  id: string,
  r: Reference,
): FormattedReference => (
  {
    id,
    ref: reference2bibliography(r),
    url: r.URL,
  }
);
