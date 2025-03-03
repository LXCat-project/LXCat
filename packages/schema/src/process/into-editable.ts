// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { EditedLTPDocument } from "../edited-document.js";
import { VersionedLTPDocument } from "../versioned-document.js";

export const intoEditable = (doc: VersionedLTPDocument): EditedLTPDocument => {
  const editable: Record<string, unknown> = doc;

  editable.contributor = doc.contributor.name;

  editable.states = Object.fromEntries(
    Object.entries(doc.states).map(([key, value]) => [key, value.detailed]),
  );

  return EditedLTPDocument.parse(editable);
};
