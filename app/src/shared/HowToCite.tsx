// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Reference } from "./Reference";
import { Reference as ReferenceRecord } from "@lxcat/schema/dist/core/reference";

interface Props {
  references: ReferenceRecord[];
}

export const HowToCite = ({ references }: Props) => {
  return (
    <div>
      <h2>How to reference data</h2>
      <ul>
        <li>Reference to LXCat</li>
        {references.map((r, i) => (
          <li key={i}>
            <Reference {...r} />
          </li>
        ))}
      </ul>
      ...
    </div>
  );
};
