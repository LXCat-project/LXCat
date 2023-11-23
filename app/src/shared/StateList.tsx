// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { StatePath, StateTree } from "@lxcat/database/shared";
import { Button, Stack } from "@mantine/core";
import { StateSelect } from "./StateSelect";

export interface StateListProps {
  entries: Array<{ id: string; data: StateTree; selected: StatePath }>;
  onAppend: () => void | Promise<void>;
  onRemove: (index: number) => void | Promise<void>;
  onUpdate: (index: number, selected: StatePath) => void | Promise<void>;
}

export const StateList = ({
  entries,
  onAppend,
  onRemove,
  onUpdate,
}: StateListProps) => {
  return (
    <Stack align="stretch" gap="xs">
      {entries.map((entry, index) => {
        return (
          <Button.Group
            key={entry.id}
            style={{ borderRadius: 4, overflow: "hidden" }}
          >
            <Button variant="subtle" onClick={() => onRemove(index)}>
              -
            </Button>
            <StateSelect
              data={entry.data}
              selected={entry.selected}
              onChange={async (selected) => onUpdate(index, selected)}
              style={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderLeftStyle: "none",
              }}
            />
          </Button.Group>
        );
      })}
      <div>
        <Button onClick={onAppend}>+</Button>
      </div>
    </Stack>
  );
};
