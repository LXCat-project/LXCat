// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { StatePath, StateTree } from "@lxcat/database/shared";
import { Button, Stack } from "@mantine/core";
import { getLatexFromTree, StateSelect } from "./state-select";

export interface StateListProps {
  entries: Array<{
    id: string;
    /** The states that can be selected in this entry. */
    tree: StateTree;
    selected: StatePath;
  }>;
  onAppend: () => void | Promise<void>;
  onRemove: (index: number) => void | Promise<void>;
  onUpdate: (
    index: number,
    selected: StatePath,
    latex: string,
  ) => void | Promise<void>;
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
            <Button variant="light" onClick={() => onRemove(index)}>
              -
            </Button>
            <StateSelect
              data={entry.tree}
              selected={entry.selected}
              onChange={(selected) =>
                onUpdate(
                  index,
                  selected,
                  getLatexFromTree(entry.tree, selected),
                )}
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
