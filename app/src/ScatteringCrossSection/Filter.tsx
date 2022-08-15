import Link from "next/link";
import { CheckBoxGroup } from "../shared/CheckBoxGroup";
import { Facets, SearchOptions } from "@lxcat/database/dist/cs/queries/public";
import {
  StateFilter,
  stateSelectionToSearchParam,
} from "../shared/StateFilter";
import { StateSelected } from "@lxcat/database/dist/shared/queries/state";
import { useRouter } from "next/router";

interface Props {
  facets: Facets;
  selection: SearchOptions;
}

export const Filter = ({ facets, selection }: Props) => {
  const router = useRouter();
  const hasAnySelection = Object.values(selection).some(
    (s) =>
      (Array.isArray(s) && s.length > 0) ||
      (typeof s === "object" && Object.keys(s).length > 0)
  );

  function onSpecies1Change(newStateSelection: StateSelected) {
    router.push({
      query: {
        ...selection,
        species1: stateSelectionToSearchParam(newStateSelection),
        species2: stateSelectionToSearchParam(selection.species2),
      },
    });
  }

  function onSpecies2Change(newStateSelection: StateSelected) {
    router.push({
      query: {
        ...selection,
        species1: stateSelectionToSearchParam(selection.species1),
        species2: stateSelectionToSearchParam(newStateSelection),
      },
    });
  }

  return (
    <div>
      <div style={{ display: "flex" }}>
        <fieldset>
          <legend>First species</legend>
          <StateFilter
            choices={facets.species1}
            selected={selection.species1}
            onChange={onSpecies1Change}
          />
        </fieldset>
        <fieldset>
          <legend>Second species</legend>
          <StateFilter
            choices={facets.species2}
            selected={selection.species2}
            onChange={onSpecies2Change}
          />
        </fieldset>
        <fieldset>
          <legend>Set</legend>
          <CheckBoxGroup
            facet={facets.set_name}
            selection={selection}
            selectionKey="set_name"
            path="/scat-cs"
          />
        </fieldset>
      </div>
      <div>
        <Link
          href={{
            pathname: "/scat-cs",
          }}
          passHref
        >
          <button disabled={!hasAnySelection}>Clear selection</button>
        </Link>
      </div>
    </div>
  );
};
