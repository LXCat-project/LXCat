import { Facets, SearchOptions } from "@lxcat/database/dist/cs/queries/public";
import { stateSelectionToSearchParam } from "../shared/StateFilter";
import { useRouter } from "next/router";
import { FilterComponent } from "./FilterComponent";

interface Props {
  facets: Facets;
  selection: SearchOptions;
}

export const Filter = ({ facets, selection }: Props) => {
  const router = useRouter();

  function onChange(newSelection: SearchOptions, event?: string) {
    const query = {
      ...newSelection,
      species1: stateSelectionToSearchParam(newSelection.species1),
      species2: stateSelectionToSearchParam(newSelection.species2),
      reactions: JSON.stringify(newSelection.reactions),
    };
    if (event?.startsWith("reactions")) {
      router.push({ query }, undefined, { shallow: true });
      // TODO make sure update is done for cs list and non-reaction filters
    }
    router.push({ query });
  }

  return (
    <FilterComponent
      facets={facets}
      selection={selection}
      onChange={onChange}
    />
  );
};
