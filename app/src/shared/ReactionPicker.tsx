import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { Box, Grid, MantineTheme, MultiSelect, Radio, Text } from "@mantine/core";
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
      <Radio.Group
        orientation="vertical"
      >
        <Radio
          value=""
          label={<Text style={{ fontSize: "1.4em" }}>➞</Text>}
        />
        <Radio
          value="reversible"
          title="Reversible"
          label={<Text style={{ fontSize: "1.4em" }}>⇄</Text>}
        />
      </Radio.Group>
      <Grid.Col span={"content"}>
        <Box sx={listStyle}>
          <StateList {...produces} />
        </Box>
      </Grid.Col>
      <MultiSelect
              placeholder="Type tags"
              data={Object.keys(ReactionTypeTag).map((t) => ({
                label: t,
                value: t,
              }))}
            />
    </Grid>
  );
};
