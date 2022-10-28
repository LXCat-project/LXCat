import {
  Box,
  MantineTheme,
  MultiSelect,
  MultiSelectProps,
  Sx,
} from "@mantine/core";
import { StateList, StateListProps } from "./StateList";

interface ReactionPickerProps {
  consumes: StateListProps;
  produces: StateListProps;
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
            <Box sx={listStyle}>
              <StateList {...produces} />
            </Box>
          </td>
        </tr>
        <tr>
          <td colSpan={2}>
            <MultiSelect sx={{}} {...typeTags} />
          </td>
        </tr>
      </tbody>
    </table>
  );
};
