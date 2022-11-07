// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Link from "next/link";
import { CheckBoxGroup } from "../shared/CheckBoxGroup";
import { FilterOptions } from "@lxcat/database/dist/css/queries/public";
import { StateChoices } from "@lxcat/database/dist/shared/queries/state";
import { useRouter } from "next/router";
import {
  stateSelectionToSearchParam,
  StateFilter,
} from "../shared/StateFilter";

interface Props {
  facets: FilterOptions;
  selection: FilterOptions;
}

export const Filter = ({ facets, selection }: Props) => {
  const router = useRouter();

  const hasAnySelection = Object.values(selection).some(
    (s) =>
      (Array.isArray(s) && s.length > 0) ||
      (typeof s === "object" && Object.keys(s).length > 0)
  );
  function onStateChange(newStateSelection: StateChoices) {
    router.push({
      query: {
        ...selection,
        state: stateSelectionToSearchParam(newStateSelection),
      },
    });
  }
  const selectionAsSearchParam = {
    ...selection,
    state: stateSelectionToSearchParam(selection.state),
  };
  return (
    <div>
      <div style={{ display: "flex" }}>
        <fieldset>
          <legend title="Species of consumed part of reaction of any cross section in set. Excluding electron">
            Species
          </legend>
          <StateFilter
            choices={facets.state}
            selected={selection.state}
            onChange={onStateChange}
          />
        </fieldset>
        <fieldset>
          <legend>Contributor</legend>
          <CheckBoxGroup
            facet={facets.contributor}
            selection={selectionAsSearchParam}
            selectionKey="contributor"
            path="/scat-css"
          />
        </fieldset>
        <fieldset>
          <legend>Reaction type</legend>
          <CheckBoxGroup
            facet={facets.tag}
            selection={selectionAsSearchParam}
            selectionKey="tag"
            path="/scat-css"
          />
        </fieldset>
      </div>
      <div>
        <Link
          href={{
            pathname: "/scat-css",
          }}
          passHref
        >
          <button disabled={!hasAnySelection}>Clear selection</button>
        </Link>
      </div>
    </div>
  );
};
