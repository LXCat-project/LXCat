import Link from "next/link";
import { CheckBoxGroup } from "../shared/CheckBoxGroup";
import { Facets, SearchOptions } from "@lxcat/database/dist/cs/queries/public";

interface Props {
  facets: Facets;
  selection: SearchOptions;
}

export const Filter = ({ facets, selection }: Props) => {
  const hasAnySelection = Object.values(selection).some((s) => s.length > 0);
  return (
    <div>
      <div style={{ display: "flex" }}>
        <fieldset>
          <legend>First species</legend>
          <CheckBoxGroup
            facet={facets.species1}
            selection={selection}
            selectionKey="species1"
            path="/scat-cs"
          />
        </fieldset>
        <fieldset>
          <legend>Second species</legend>
          <CheckBoxGroup
            facet={facets.species2}
            selection={selection}
            selectionKey="species2"
            path="/scat-cs"
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
