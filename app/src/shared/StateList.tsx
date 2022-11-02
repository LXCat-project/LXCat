import { StatePath } from "@lxcat/database/dist/shared/getStateLeaf";
import { StateTree } from "@lxcat/database/dist/shared/queries/state";
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
            <StateSelect
              data={entry.data}
              selected={entry.selected}
              onChange={async (selected) => onUpdate(index, selected)}
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
