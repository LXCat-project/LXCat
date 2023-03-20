// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { StateProcess } from "@lxcat/database/dist/cs/picker/types";
import { StatePath } from "@lxcat/database/dist/shared/getStateLeaf";
import { Button, Stack } from "@mantine/core";
import { SWRReactionOptions, SWRStateSelect } from "./SWRStateSelect";

export interface SWRStateListProps {
  entries: Array<{
    id: string;
    selection: SWRReactionOptions;
    selected: StatePath;
  }>;
  process: StateProcess;
  onAppend: () => void | Promise<void>;
  onRemove: (index: number) => void | Promise<void>;
  onUpdate: (
    index: number,
    selected: StatePath,
    latex: string,
  ) => void | Promise<void>;
}

export const SWRStateList = ({
  entries,
  process,
  onAppend,
  onRemove,
  onUpdate,
}: SWRStateListProps) => {
  return (
    <Stack align="stretch" spacing="xs">
      {entries.map((entry, index) => {
        return (
          <Button.Group
            key={entry.id}
            sx={{ borderRadius: 4, overflow: "hidden" }}
          >
            <Button variant="light" onClick={() => onRemove(index)}>
              -
            </Button>
            <SWRStateSelect
              selection={entry.selection}
              process={process}
              selected={entry.selected}
              onChange={async (selected, latex) =>
                onUpdate(index, selected, latex)}
              inGroup={false}
              sx={{
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
