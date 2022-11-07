// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CrossSectionItem } from "@lxcat/database/dist/cs/public";
import { Facets, SearchOptions } from "@lxcat/database/dist/cs/queries/public";
import { Checkbox, Space, Group, Button } from "@mantine/core";
import { useState } from "react";
import { FilterComponent } from "./FilterComponent";
import { ReactionSummary } from "./ReactionSummary";

export type Picked = CrossSectionItem[];

export const Picker = ({
  filterChoices,
  filterSelection,
  setFilterSelection,
  choices,
  onSubmit,
}: {
  filterChoices: Facets;
  filterSelection: SearchOptions;
  setFilterSelection: (selection: SearchOptions) => void;
  choices: Picked;
  onSubmit: (picked: Picked) => void;
}) => {
  const [picked, setPicked] = useState<string[]>([]);

  function onLocalSubmit() {
    const fullPicked: Picked = picked
      .map((pid) => choices.find((c) => c.id === pid))
      .filter((p): p is CrossSectionItem => p !== undefined);
    onSubmit(fullPicked);
  }

  return (
    <>
      <fieldset>
        <legend>Filter</legend>
        <FilterComponent
          facets={filterChoices}
          selection={filterSelection}
          onChange={setFilterSelection}
        />
      </fieldset>
      <fieldset>
        <legend>Picks</legend>
        <Checkbox.Group value={picked} onChange={setPicked}>
          {choices.map((c) => (
            <Checkbox
              key={c.id}
              value={c.id}
              label={
                <ReactionSummary {...c.reaction} />
                // TODO use latex reaction as label for cs
              }
            />
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
