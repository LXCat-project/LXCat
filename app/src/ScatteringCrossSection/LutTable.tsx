// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LUT } from "@lxcat/schema/core/data_types";

type Props = Pick<LUT, "data" | "labels" | "units">;

export const LutTable = ({ labels, units, data }: Props) => (
  <table>
    <thead>
      <tr>
        {labels.map((l, i) => (
          <td key={l}>
            {l} ({units[i]})
          </td>
        ))}
      </tr>
    </thead>
    <tbody>
      {data.map((r, i) => (
        <tr key={i}>
          {r.map((c, j) => (
            <td key={j}>{c}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);
