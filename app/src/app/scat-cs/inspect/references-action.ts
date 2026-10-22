// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { referenceFormatSchema } from "@/app/api/references/[format]/schemas";
import {
  formatReferences,
  getReferencesForSelection,
} from "@/citation/export-references";
import { BAG_SIZE } from "@/cs/constants";
import { z } from "zod";

export async function getReferencesForSelectionAction(
  format: unknown,
  ids: unknown,
) {
  return formatReferences(
    referenceFormatSchema.parse(format),
    await getReferencesForSelection(
      z.array(z.string().min(1)).min(1).max(BAG_SIZE).parse(ids),
    ),
  );
}
