// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Reference } from "./Reference";
import { TableScrollArea } from "./Table";
import { FormattedReference } from "./types";

export const ReferenceList = ({
  references,
}: {
  references: Array<FormattedReference>;
}) => (
  <TableScrollArea
    headers={[{ label: "References", key: "ref" }]}
    data={references.map((ref) => ({
      key: ref.id,
      ref: <Reference>{ref}</Reference>,
    }))}
  />
);
