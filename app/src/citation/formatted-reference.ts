// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "server-only";

import { Reference } from "@lxcat/schema";
import { formatReference as formatReferenceText } from "./cite";

export interface FormattedReference {
  id: string;
  ref: string;
  url?: string;
}

export const formatReference = async (
  id: string,
  r: Reference,
): Promise<FormattedReference> => (
  {
    id,
    ref: await formatReferenceText(r),
    url: r.URL,
  }
);
