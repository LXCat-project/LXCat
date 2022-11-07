// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  StateChoices,
  StateDict,
} from "@lxcat/database/dist/shared/queries/state";
import { Button, Checkbox, Group, Space } from "@mantine/core";
import { useState } from "react";
import { StateFilter } from "../shared/StateFilter";

export const StatePicker = ({
  filterChoices,
  filterSelection,
  setFilterSelection,
  choices,
  onSubmit,
}: {
  filterChoices: StateChoices;
  filterSelection: StateChoices;
  setFilterSelection: (selection: StateChoices) => void;
  choices: StateDict;
  onSubmit: (picked: StateDict) => void;
}) => {
  const [picked, setPicked] = useState<string[]>([]);

  function onLocalSubmit() {
    const pickedStates = Object.fromEntries(picked.map((k) => [k, choices[k]]));
    onSubmit(pickedStates);
  }

  return (
    <>
      <fieldset>
        <legend>Filter</legend>
        <StateFilter
          choices={filterChoices}
          selected={filterSelection}
          onChange={setFilterSelection}
        />
      </fieldset>
      <fieldset>
        <legend>Picks</legend>
        <Checkbox.Group value={picked} onChange={setPicked}>
          {Object.entries(choices).map(([k, v]) => (
            <Checkbox key={k} value={k} label={v.id} />
          ))}
        </Checkbox.Group>
      </fieldset>
      {/* TODO add paging or scrolling, now first 100 are shown */}
      <Space h="md" />
      <Group position="center">
        <Button type="button" onClick={onLocalSubmit}>
          Add picked states
        </Button>
      </Group>
    </>
  );
};
