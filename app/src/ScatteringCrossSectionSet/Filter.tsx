import Link from "next/link";
import { CheckBoxGroup } from "../shared/CheckBoxGroup";
import { Facets, FilterOptions } from "@lxcat/database/dist/css/queries/public";
import { StateSelected } from "@lxcat/database/dist/shared/queries/state";
import { useRouter } from "next/router";
import {
  stateSelectionToSearchParam,
  StateFilter,
} from "../shared/StateFilter";

interface Props {
  facets: Facets;
  selection: FilterOptions;
}

const ReactionDirectionFilter = ({
  selection,
  path,
}: {
  selection: any;
  path: string;
}) => {
  const reversibleChecked = selection.reversible === true;
  const irreversibleChecked = selection.reversible === false;
  const iquery = {
    ...selection,
    reversible: irreversibleChecked ? undefined : false,
  };
  const rquery = {
    ...selection,
    reversible: reversibleChecked ? undefined : true,
  };
  return (
    <div>
      <Link
        href={{
          pathname: path,
          query: iquery,
        }}
      >
        <a>
          <label>
            <input type="checkbox" readOnly checked={irreversibleChecked} />
            Irreversible
          </label>
        </a>
      </Link>
      <Link
        href={{
          pathname: path,
          query: rquery,
        }}
      >
        <a>
          <label>
            <input type="checkbox" readOnly checked={reversibleChecked} />
            Reversible
          </label>
        </a>
      </Link>
    </div>
  );
};

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
          <legend>Reaction</legend>
          <h4>Direction</h4>
          <ReactionDirectionFilter
            path="/scat-css"
            selection={selectionAsSearchParam}
          />
          <h4>Type tags</h4>
          <CheckBoxGroup
            facet={[
              "Elastic",
              "Effective",
              "Electronic",
              "Vibrational",
              "Rotational",
              "Attachment",
              "Ionization",
            ]}
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
