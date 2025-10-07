// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useRouter } from "next/navigation";
import {
  FilterComponentProps,
  ReactionInformation,
  SWRFilterComponent,
} from "./swr-filter-component";

export const Filter = (
  { selection, onChange, ...rest }: FilterComponentProps,
) => {
  const router = useRouter();

  function onFilterChange(
    newSelection: Array<ReactionInformation>,
  ) {
    const query = new URLSearchParams({
      reactions: JSON.stringify(newSelection.map(({ options }) => options)),
    }).toString();

    router.push(`data?${query}`);
    onChange(newSelection);
  }

  return (
    <SWRFilterComponent
      selection={selection}
      onChange={onFilterChange}
      {...rest}
    />
  );
};
