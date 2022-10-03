import { MantineProvider } from "@mantine/core";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { theme } from "../theme";
import { StatePicker } from "./StatePicker";

const meta = {
  component: StatePicker,
  argTypes: {
    onSubmit: { action: "submitted" },
    onFilterChange: { action: "filterChange" },
  },
  decorators: [
    (Story) => (
      <MantineProvider withGlobalStyles withNormalizeCSS theme={theme}>
        <Story />
      </MantineProvider>
    ),
  ],
} as ComponentMeta<typeof StatePicker>;

export default meta;

const Template: ComponentStory<typeof StatePicker> = (args) => (
  <StatePicker {...args} />
);

export const Minimal = Template.bind({});
Minimal.args = {
  filterChoices: {
    particle: {
      e: {
        charge: {
          "-1": { electronic: {} },
        },
      },
      Ar: {
        charge: {
          "0": { electronic: {} },
          "1": { electronic: {} },
        },
      },
    },
  },
  choices: {
    "1": {
      id: "e",
      particle: "e",
      charge: -1,
    },
    "2": {
      id: "Ar",
      particle: "Ar",
      charge: 0,
    },
    "3": {
      id: "Ar^1",
      particle: "Ar",
      charge: 1,
    },
  },
};
