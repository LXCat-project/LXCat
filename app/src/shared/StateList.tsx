import { Button, Center, Stack } from "@mantine/core";
import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { StateSelection, StateSelect, StateTree } from "./StateSelect";

interface StateListProps {
  data: StateTree;
  onChange: (stateIds: Array<string>) => void;
}

export interface StateListStaticProps {
  entries: Array<{ id: string; data: StateTree; selected: StateSelection }>;
  onAppend: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, selected: StateSelection) => void;
}

export const StateListStatic = ({
  entries,
  onAppend,
  onRemove,
  onUpdate,
}: StateListStaticProps) => {
  return (
    <Stack align={"stretch"} spacing={"xs"}>
      {entries.map((entry, index) => {
        return (
          <Button.Group key={entry.id}>
            <Button onClick={() => onRemove(index)}>-</Button>
            <StateSelect
              data={entry.data}
              selected={entry.selected}
              onChange={(selected) => onUpdate(index, selected)}
              inGroup={false}
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

// TODO implement
// export const StateList = ({ data, onChange }: StateListProps) => {
//   const { control } = useForm<ListValues>();
//   const { fields, append, update, remove } = useFieldArray({
//     name: "entries",
//     control,
//   });

//   useEffect(() => {
//     onChange(
//       fields
//         .map(
//           ({ selected: { particle, electronic, vibrational, rotational } }) =>
//             rotational ?? vibrational ?? electronic ?? particle
//         )
//         .filter((id): id is string => id !== undefined)
//     );
//   }, [fields]);

//   return (
//     <Stack align={"stretch"} spacing={"xs"}>
//       {fields.map((field, i) => {
//         return (
//           <Button.Group key={field.id}>
//             <Button onClick={() => remove(i)}>-</Button>
//             <StateSelect
//               data={data}
//               selected={field.selected}
//               onChange={(selected) => {
//                 update(i, { selected });
//               }}
//               inGroup={false}
//             />
//           </Button.Group>
//         );
//       })}
//       <Center>
//         <Button
//           onClick={() => {
//             append({ selected: {} });
//           }}
//         >
//           +
//         </Button>
//       </Center>
//     </Stack>
//   );
// };
