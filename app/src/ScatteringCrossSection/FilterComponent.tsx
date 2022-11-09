// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Facets, SearchOptions } from "@lxcat/database/dist/cs/queries/public";
import { StateChoices } from "@lxcat/database/dist/shared/queries/state";
import { StateFilter } from "../shared/StateFilter";
import { StringsFilter } from "../shared/StringsFilter";

export const FilterComponent = ({
  facets,
  selection,
  onChange,
}: {
  facets: Facets;
  selection: SearchOptions;
  onChange: (selection: SearchOptions) => void;
}) => {
  const hasAnySelection = Object.values(selection).some(
    (s) =>
      (Array.isArray(s) && s.length > 0) ||
      (typeof s === "object" && Object.keys(s).length > 0)
  );

  function onSpecies1Change(newStateSelection: StateChoices) {
    onChange({
      ...selection,
      species1: newStateSelection,
    });
  }

  function onSpecies2Change(newStateSelection: StateChoices) {
    onChange({
      ...selection,
      species2: newStateSelection,
    });
  }

  function onSetChange(newSetSelection: string[]) {
    onChange({
      ...selection,
      set_name: newSetSelection,
    });
  }

  function onTagChange(newTagSelection: string[]) {
    onChange({
      ...selection,
      tag: newTagSelection,
    });
  }

  function onReset() {
    onChange({
      set_name: [],
      tag: [],
      species1: { particle: {} },
      species2: { particle: {} },
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
          <StringsFilter
            choices={facets.set_name}
            selection={selection.set_name}
            onChange={onSetChange}
          />
        </fieldset>
        <fieldset>
          <legend>Reaction type</legend>
          <StringsFilter
            // TODO order type tags alphabetically?
            choices={facets.tag}
            selection={selection.tag}
            onChange={onTagChange}
          />
        </fieldset>
      </div>
      <div>
        <button disabled={!hasAnySelection} onClick={onReset}>
          Clear selection
        </button>
      </div>
    </div>
  );
};
