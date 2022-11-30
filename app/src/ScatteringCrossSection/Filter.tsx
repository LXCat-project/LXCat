// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Facets, SearchOptions } from "@lxcat/database/cs/queries/public";
import { stateSelectionToSearchParam } from "../shared/StateFilter";
import { useRouter } from "next/router";
import { FilterComponent } from "./FilterComponent";

interface Props {
  facets: Facets;
  selection: SearchOptions;
}

export const Filter = ({ facets, selection }: Props) => {
  const router = useRouter();

  function onChange(newSelection: SearchOptions) {
    router.push({
      query: {
        ...newSelection,
        species1: stateSelectionToSearchParam(newSelection.species1),
        species2: stateSelectionToSearchParam(newSelection.species2),
      },
    });
  }

  return (
    <FilterComponent
      facets={facets}
      selection={selection}
      onChange={onChange}
    />
  );
};
