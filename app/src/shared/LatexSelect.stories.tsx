// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { MantineProvider } from "@mantine/core";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { theme } from "../theme";
import { LatexSelect } from "./LatexSelect";

import { useState } from "react";

const meta = {
  component: LatexSelect,
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
} as ComponentMeta<typeof LatexSelect>;

export default meta;

const Template: ComponentStory<typeof LatexSelect> = (args) => {
  const [value, setValue] = useState(args.value);
  return (
    <LatexSelect
      {...args}
      value={value}
      onChange={(newValue: string) => {
        setValue(newValue);
        args.onChange(newValue);
      }}
    />
  );
};

export const Minimal = Template.bind({});
Minimal.args = {
  value: "1",
  choices: {
    "1": "\\mathrm{e}",
    "2": "\\mathrm{Ar}",
    "3": "\\mathrm{Ar^+}",
    "4": "\\mathrm{Ar}\\left(3p^{5}({}^{2}\\mathrm{P}^o_{3/2})3d({}^{2}\\mathrm{D}){}^{2}[5/2]^o_{3}\\right)",
  },
};
export const Many = Template.bind({});
Many.args = {
  value: "1",
  choices: Object.fromEntries(
    Array.from(Array(100).keys()).map((key) => [key.toString(), key.toString()])
  ),
};
