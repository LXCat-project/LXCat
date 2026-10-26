// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  FilterComponentProps,
  ReactionInformation,
  SWRFilterComponent,
} from "./swr-filter-component";

export const Filter = (
  { selection, onChange, ...rest }: FilterComponentProps,
) => {
  function onFilterChange(
    newSelection: Array<ReactionInformation>,
  ) {
    const query = new URLSearchParams({
      reactions: JSON.stringify(newSelection.map(({ options }) => options)),
    }).toString();

    // The page keeps the selection in its own state, so only the URL has to
    // follow. Navigating with the router would make the server render the
    // page again, and the client ignores the result.
    window.history.replaceState(null, "", `/scat-cs?${query}`);
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
