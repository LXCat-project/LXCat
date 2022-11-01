import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import {
  Box,
  MantineTheme,
  MultiSelect,
  MultiSelectProps,
  Radio,
  Sx,
  Text,
} from "@mantine/core";
import { LatexSelect, LatexSelectProps } from "./LatexSelect";
import { StateList, StateListProps } from "./StateList";
import { Reversible } from "@lxcat/database/dist/cs/queries/public";
import { CSSetFilter, CSSetFilterProps } from "./CSSetFilter";

interface ReactionPickerProps {
  consumes: StateListProps;
  produces: StateListProps;
  reversible: Omit<LatexSelectProps, "choices"> & {
    choices: Array<Reversible>;
  };
  typeTags: Omit<MultiSelectProps, "sx">;
  sets: CSSetFilterProps;
}

const listStyle: Sx = (theme: MantineTheme) => ({
  padding: theme.spacing.xs,
  borderStyle: "solid",
  borderRadius: theme.radius.md,
  borderColor: theme.colors.gray[4],
  borderWidth: "thin",
});

const choiceMap: Record<Reversible, string> = {
  [Reversible.Both]: "\\rightarrow \\\\ \\leftrightarrow",
  [Reversible.False]: "\\rightarrow",
  [Reversible.True]: "\\leftrightarrow",
};

export const ReactionPicker = ({
  consumes,
  produces,
  reversible: { choices, ...reversible },
  typeTags,
  sets,
}: ReactionPickerProps) => {
  return (
    <table>
      <tbody>
        <tr>
          <td>
            <Box sx={listStyle}>
              <StateList {...consumes} />
            </Box>
          </td>
          <td>
            <LatexSelect
              choices={Object.fromEntries(
                Object.entries(choiceMap).filter(([key, _]) =>
                  choices.includes(key as Reversible)
                )
              )}
              {...reversible}
            />
          </td>
          <td>
            <Box sx={listStyle}>
              <StateList {...produces} />
            </Box>
          </td>
          <td rowSpan={2}>
            <Box sx={listStyle}>
              <CSSetFilter {...sets} />
            </Box>
          </td>
        </tr>
        <tr>
          <td colSpan={3}>
            <MultiSelect sx={{}} {...typeTags} />
          </td>
        </tr>
      </tbody>
    </table>
  );
};
