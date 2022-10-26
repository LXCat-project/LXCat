import { Facets, SearchOptions } from "@lxcat/database/dist/cs/queries/public";
import { StateChoices } from "@lxcat/database/dist/shared/queries/state";
import { ActionIcon, Box, Button } from "@mantine/core";
import { IconCheck, IconEdit } from "@tabler/icons";
import { useState } from "react";
import { ReactionPicker } from "../shared/ReactionPicker";
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

  const [reactions, setReactions] = useState([{
    consumes: [],
    produces: [],
    edit: true
  }])

  function addReaction() {

  }

  return (
    <div>
      <div style={{ display: "flex" }}>
        {/* <fieldset>
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
        </fieldset> */}
        <fieldset style={{flexGrow:1}}>
          <legend>Reaction</legend>
          <ul>
            {reactions.map((r, i) => 
               <li key={i} style={{display: 'flex' }}>
                {r.edit ? 
                  <>
                  <ReactionPicker                 
                    consumes={{ 
                      entries: r.consumes,
                      onAppend: () => {},
                      onRemove: () => {},
                      onUpdate: () => {},
                    }}
                    produces={{ 
                      entries: r.produces,
                      onAppend: () => {},
                      onRemove: () => {},
                      onUpdate: () => {},
                    }}
                  />
                  <ActionIcon variant="light"><IconCheck size={16} /></ActionIcon>
                  </>
                  :
                  <>
                    <span>Reaction TODO</span>
                    <ActionIcon variant="light"><IconEdit size={16} /></ActionIcon>
                    </>
                }
                <Button></Button>
              </li>
              )}
          </ul>
          <Box sx={{ display: 'flex', justifyContent: 'end' }}>
            <Button title="Add reaction filter" onClick={addReaction}>+</Button>
          </Box>
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
        <Button variant="outline" disabled={!hasAnySelection} onClick={onReset}>
          Clear selection
        </Button>
      </div>
    </div>
  );
};
