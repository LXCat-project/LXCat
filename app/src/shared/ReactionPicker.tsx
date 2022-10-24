import { Box, Grid, MantineTheme } from "@mantine/core";
import { StateList, StateListProps } from "./StateList";

interface ReactionPickerProps {
  consumes: StateListProps;
  produces: StateListProps;
}

const listStyle = (theme: MantineTheme) => ({
  padding: theme.spacing.md,
  borderStyle: "solid",
  borderRadius: theme.radius.md,
  borderColor: theme.colors.brand[3],
});

export const ReactionPicker = ({ consumes, produces }: ReactionPickerProps) => {
  return (
    <Grid align={"center"}>
      <Grid.Col span={"content"}>
        <Box sx={listStyle}>
          <StateList {...consumes} />
        </Box>
      </Grid.Col>
      <Grid.Col span={"content"}>
        <Box sx={listStyle}>
          <StateList {...produces} />
        </Box>
      </Grid.Col>
    </Grid>
  );
};
