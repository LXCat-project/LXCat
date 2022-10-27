import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { Box, Grid, MantineTheme, MultiSelect, MultiSelectProps, Radio, Sx, Text } from "@mantine/core";
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
<<<<<<< HEAD
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
=======
    <table>
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
    </table>
>>>>>>> lxcat/state-select
  );
};
