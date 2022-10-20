import { Button, Center, Stack } from "@mantine/core";
import { StateSelection, StateSelect, StateTree } from "./StateSelect";

export interface StateListProps {
  entries: Array<{ id: string; data: StateTree; selected: StateSelection }>;
  onAppend: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, selected: StateSelection) => void;
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
          <Button.Group key={entry.id} sx={{borderRadius:4, overflow: "hidden"}}>
            <Button onClick={() => onRemove(index)}>-</Button>
            <StateSelect
              data={entry.data}
              selected={entry.selected}
              onChange={(selected) => onUpdate(index, selected)}
              inGroup={false}
              sx={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
              }}
            />
          </Button.Group>
        );
      })}
      <Center>
        <Button onClick={onAppend}>+</Button>
      </Center>
    </Stack>
  );
};
