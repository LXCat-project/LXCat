import { Button, Center, Group, Stack } from "@mantine/core";
import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { StateSelection, StateSelect, StateTree } from "./StateSelect";

interface StateListProps {
  data: StateTree;
  name: string;
  onChange: (stateIds: Array<string>) => void;
}

interface ListValues {
  entries: {
    selected: StateSelection;
  }[];
}

export const StateList = ({ data, name, onChange }: StateListProps) => {
  const { control } = useForm<ListValues>();
  const { fields, append, update, remove } = useFieldArray({
    name: "entries",
    control,
  });

  useEffect(() => {
    onChange(
      fields
        .map(
          ({ selected: { particle, electronic, vibrational, rotational } }) =>
            rotational ?? vibrational ?? electronic ?? particle
        )
        .filter((id): id is string => id !== undefined)
    );
  }, [fields]);

  return (
    <Stack align={"stretch"} spacing={"xs"}>
      {fields.map((field, i) => {
        return (
          <Button.Group key={field.id}>
            <Button onClick={() => remove(i)}>-</Button>
            <StateSelect
              data={data}
              selected={field.selected}
              onChange={(selected) => {
                update(i, { selected });
              }}
              inGroup={false}
            />
          </Button.Group>
        );
      })}
      <Center>
        <Button
          onClick={() => {
            append({ selected: {} });
          }}
        >
          +
        </Button>
      </Center>
    </Stack>
  );
};
