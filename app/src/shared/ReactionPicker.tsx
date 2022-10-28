import {
  Box,
  MantineTheme,
  MultiSelect,
  MultiSelectProps,
  Sx,
} from "@mantine/core";
import { LatexSelect, LatexSelectProps } from "./LatexSelect";
import { StateList, StateListProps } from "./StateList";

interface ReactionPickerProps {
  consumes: StateListProps;
  produces: StateListProps;
  reversible: Omit<LatexSelectProps, "choices">;
  typeTags: Omit<MultiSelectProps, "sx">;
}

const listStyle: Sx = (theme: MantineTheme) => ({
  padding: theme.spacing.xs,
  borderStyle: "solid",
  borderRadius: theme.radius.md,
  borderColor: theme.colors.gray[4],
  borderWidth: "thin",
});

export const ReactionPicker = ({
  consumes,
  produces,
  reversible,
  typeTags,
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
              choices={{
                any: "\\rightarrow \\\\ \\leftrightarrow",
                right: "\\rightarrow",
                reversible: "\\leftrightarrow",
              }}
              {...reversible}
            />
          </td>
          <td>
            <Box sx={listStyle}>
              <StateList {...produces} />
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
