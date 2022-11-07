// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { StateFilter } from "./StateFilter";
import { ComponentStory, ComponentMeta } from "@storybook/react";

const meta = {
  component: StateFilter,
  argTypes: { onChange: { action: "change" } },
} as ComponentMeta<typeof StateFilter>;

export default meta;

const Template: ComponentStory<typeof StateFilter> = (args) => (
  <StateFilter {...args} />
);

export const Electron = Template.bind({});
Electron.args = {
  choices: {
    particle: {
      e: {
        charge: {
          "-1": {
            electronic: {},
          },
        },
      },
    },
  },
  selected: {
    particle: {
      e: {
        charge: {
          "-1": {
            electronic: {},
          },
        },
      },
    },
  },
};

export const StateWithRotational = Template.bind({});
StateWithRotational.args = {
  choices: {
    particle: {
      H2: {
        charge: {
          0: {
            electronic: {
              "I^1P_g": {
                vibrational: {
                  "0": {
                    rotational: ["1", "2"],
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  selected: {
    particle: {
      H2: {
        charge: {
          0: {
            electronic: {
              "I^1P_g": {
                vibrational: {
                  "0": {
                    rotational: ["1"],
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export const SomeIons = Template.bind({});
SomeIons.args = {
  choices: {
    particle: {
      O: {
        charge: {
          0: { electronic: {} },
          "-2": { electronic: {} },
        },
      },
      S: {
        charge: {
          0: {
            electronic: {},
          },
          "-2": {
            electronic: {},
          },
          2: {
            electronic: {},
          },
          4: {
            electronic: {},
          },
          6: {
            electronic: {},
          },
        },
      },
    },
  },
};
SomeIons.args.selected = SomeIons.args.choices;
