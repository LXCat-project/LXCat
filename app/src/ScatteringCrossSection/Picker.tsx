// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CrossSectionItem } from "@lxcat/database/dist/cs/public";
import { Button, Checkbox, Group, Space } from "@mantine/core";
import { useState } from "react";
import { ReactionSummary } from "./ReactionSummary";
import { ReactionInformation, SWRFilterComponent } from "./SWRFilterComponent";

export type Picked = CrossSectionItem[];

export const Picker = ({
  filterSelection,
  setFilterSelection,
  choices,
  onSubmit,
}: {
  filterSelection: Array<ReactionInformation>;
  setFilterSelection: (selection: Array<ReactionInformation>) => void;
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
        <SWRFilterComponent
          selection={filterSelection}
          onChange={setFilterSelection}
          editableReaction={0}
          onEditableReactionChange={() => {}}
        />
      </fieldset>
      <fieldset>
        <legend>Picks</legend>
        <Checkbox.Group value={picked} onChange={setPicked}>
          {choices.map((c) => (
            <Checkbox
              key={c.id}
              value={c.id}
              label={<ReactionSummary {...c.reaction} />}
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
