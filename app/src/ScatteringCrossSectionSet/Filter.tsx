import Link from "next/link";
import { CheckBoxGroup } from "../shared/CheckBoxGroup";
import { Facets, FilterOptions } from "@lxcat/database/dist/css/queries/public";
import { StateFilter, stateSelectionToSearchParam } from "./StateFilter";
import { StateSelected } from "@lxcat/database/dist/shared/queries/state";
import { useRouter } from "next/router";

interface Props {
  facets: Facets;
  selection: FilterOptions;
}

export const Filter = ({ facets, selection }: Props) => {
  const router = useRouter();

  const hasAnySelection = Object.values(selection).some(
    (s) =>
      (Array.isArray(s) && s.length > 0) ||
      (typeof s === "object" && Object.keys(s).length > 0)
  );
  function onStateChange(newStateSelection: StateSelected) {
    router.push({
      query: {
        contributor: selection.contributor,
        state: stateSelectionToSearchParam(newStateSelection),
      },
    });
  }
  return (
    <div>
      <div style={{ display: "flex" }}>
        <fieldset>
          <legend title='Species of consumed part of reaction of any cross section in set. Excluding electron'>Species</legend>
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
            selection={{
              ...selection,
              state: stateSelectionToSearchParam(selection.state),
            }}
            selectionKey="contributor"
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
