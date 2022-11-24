// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Facets, ReactionTemplate } from "@lxcat/database/dist/cs/picker/types";
import { useRouter } from "next/router";
import { SWRFilterComponent } from "./SWRFilterComponent";

interface Props {
  facets: Facets;
  selection: Array<ReactionTemplate>;
  onChange: (newSelection: Array<ReactionTemplate>) => void | Promise<void>;
}

export const Filter = ({ facets, selection, onChange }: Props) => {
  const router = useRouter();

  function onFilterChange(
    newSelection: Array<ReactionTemplate>,
    event?: string
  ) {
    const query = new URLSearchParams({
      reactions: JSON.stringify(newSelection),
    }).toString();

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
