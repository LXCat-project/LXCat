// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Facets, SearchOptions } from "@lxcat/database/dist/cs/queries/public";
import { useRouter } from "next/router";
import { useSWRConfig } from "swr/_internal";
import { SWRFilterComponent } from "./SWRFilterComponent";

interface Props {
  facets: Facets;
  selection: SearchOptions;
  onChange: (newSelection: SearchOptions) => void | Promise<void>;
}

export const Filter = ({ facets, selection, onChange }: Props) => {
  const router = useRouter();
  const {cache} = useSWRConfig();
  console.log(cache);

  function onFilterChange(newSelection: SearchOptions, event?: string) {
    const query = {
      ...newSelection,
      reactions: JSON.stringify(newSelection.reactions),
    };
    if (event?.startsWith("reactions")) {
      router.push({ query }, undefined, { shallow: true });
      onChange(newSelection);
    } else {
      router.push({ query });
    }
  }

  return (
      <SWRFilterComponent
        // facets={facets}
        selection={selection}
        onChange={onFilterChange}
      />
  );
};
