// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Link from "next/link";

interface Props {
  facet: string[];
  selection: any; // TODO restrict to types to where it is used
  selectionKey: string;
  path: string;
}

export const CheckBoxGroup = ({
  facet,
  selection,
  selectionKey,
  path,
}: Props) => {
  const selectionValue = selection[selectionKey];
  return (
    <div>
      {facet.map((d) => {
        const checked = selectionValue.some((s: unknown) => s === d);
        const query = {
          ...selection,
          // If checked then remove item else add item
          [selectionKey]: checked
            ? selectionValue.filter((s: unknown) => s !== d)
            : [...selectionValue, d],
        };
        return (
          <div key={d}>
            <Link
              href={{
                pathname: path,
                query,
              }}
            >
              <a>
                <label>
                  <input type="checkbox" readOnly checked={checked} />
                  {d}
                </label>
              </a>
            </Link>
          </div>
        );
      })}
    </div>
  );
};
