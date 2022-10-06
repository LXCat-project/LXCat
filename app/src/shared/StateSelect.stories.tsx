import { MantineProvider } from "@mantine/core";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { theme } from "../theme";

// import { useState } from "react";
import { StateSelect } from "./StateSelect";

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
  return <StateSelect {...args} />;
};

export const Minimal = Template.bind({});
Minimal.args = {
  data: {
    e: { latex: "\\mathrm{e}" },
    Ar: {
      latex: "\\mathrm{Ar}",
      children: {
        "1S0": { latex: "{}^1\\mathrm{S}_0" },
        "State/2017131": {
          latex:
            "3p^{5}({}^{2}\\mathrm{P}^o_{3/2})4s({}^{2}\\mathrm{S}){}^{2}[3/2]^o_{2}",
        },
      },
    },
    N2: {
      latex: "\\mathrm{N_2}",
      children: {
        X: {
          latex: "{}^1\\Sigma^+_\\mathrm{g}",
          children: {
            0: { latex: "0", children: { 0: { latex: "0" } } },
            1: { latex: "1" },
          },
        },
      },
    },
  },
};
