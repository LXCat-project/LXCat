import { Facets, SearchOptions } from "@lxcat/database/dist/cs/queries/public";
import { useRouter } from "next/router";
import { FilterComponent } from "./FilterComponent";

interface Props {
  facets: Facets;
  selection: SearchOptions;
  onChange: (newSelection: SearchOptions) => void | Promise<void>;
}

export const Filter = ({ facets, selection, onChange }: Props) => {
  const router = useRouter();

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
    <FilterComponent
      facets={facets}
      selection={selection}
      onChange={onFilterChange}
    />
  );
};
