import { MantineProvider } from "@mantine/core";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { useState } from "react";

import { theme } from "../theme";
import { StateSelect, StateSelection } from "./StateSelect";

const meta = {
  component: StateSelect,
  argTypes: {
    onChange: { action: "changed" },
  },
  decorators: [
    (Story) => (
      <MantineProvider withGlobalStyles withNormalizeCSS theme={theme}>
        <Story />
      </MantineProvider>
    ),
  ],
} as ComponentMeta<typeof StateSelect>;

export default meta;

const Template: ComponentStory<typeof StateSelect> = (args) => {
  const [selected, setSelected] = useState<StateSelection>({});
  return (
    <StateSelect
      {...args}
      selected={selected}
      onChange={(newSelected) => {
        setSelected(newSelected);
        args.onChange(newSelected);
      }}
    />
  );
};

export const Minimal = Template.bind({});
Minimal.args = {
  data: {
    "State/1": { latex: "\\mathrm{e}" },
    "State/2": {
      latex: "\\mathrm{Ar}",
      children: {
        "State/3": { latex: "{}^1\\mathrm{S}_0" },
        "State/4": {
          latex:
            "3p^{5}({}^{2}\\mathrm{P}^o_{3/2})4s({}^{2}\\mathrm{S}){}^{2}[3/2]^o_{2}",
        },
      },
    },
    "State/5": {
      latex: "\\mathrm{N_2}",
      children: {
        "State/6": {
          latex: "{}^1\\Sigma^+_\\mathrm{g}",
          children: {
            "State/7": { latex: "0", children: { "State/8": { latex: "0" } } },
            "State/9": { latex: "1" },
          },
        },
      },
    },
  },
};
