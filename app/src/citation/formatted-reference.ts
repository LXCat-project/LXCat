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

export async function formatReference(
  id: string,
  r: Reference,
): Promise<FormattedReference>;
export async function formatReference(
  references: Record<string, Reference>,
): Promise<Array<FormattedReference>>;
export async function formatReference(
  idOrRecord: string | Record<string, Reference>,
  r?: Reference,
): Promise<FormattedReference | Array<FormattedReference>> {
  if (typeof idOrRecord === "string") {
    return {
      id: idOrRecord,
      ref: await formatReferenceText(r!),
      url: r!.URL,
    };
  }
  const formattedMap = await formatReferenceText(idOrRecord);
  return Object.entries(idOrRecord).map(([id, ref]) => ({
    id,
    ref: formattedMap[id],
    url: ref.URL,
  }));
}
