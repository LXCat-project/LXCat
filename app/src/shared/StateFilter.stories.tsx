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
  choices: [
    {
      particle: "e",
      charge: [-1],
    },
  ],
  selected: { e: { charge: [-1] } },
};

// Created data set from https://github.com/Exabyte-io/periodic-table.js/blob/dev/periodic-table.json
// and
// let choices = Object.values(data).filter(
//   e => e.oxidation_states !== ''
// ).map(e => ({
//   particle: e.symbol,
//   charge: Number.isInteger(e.oxidation_states) ? [0, e.oxidation_states] : [0, ...e.oxidation_states.split(/, /).map(c => parseInt(c))]
// }))
// console.log(JSON.stringify(choices, undefined, 2))

export const PeriodicTableAsSimpleParticles = Template.bind({});
PeriodicTableAsSimpleParticles.args = {
  choices: [
    {
      particle: "H",
      charge: [0, 1, -1],
    },
    {
      particle: "Li",
      charge: [0, 1],
    },
    {
      particle: "Be",
      charge: [0, 2],
    },
    {
      particle: "B",
      charge: [0, 3],
    },
    {
      particle: "C",
      charge: [0, 4, 2, -4],
    },
    {
      particle: "N",
      charge: [0, 5, 4, 3, 2, -3],
    },
    {
      particle: "O",
      charge: [0, -2, -1],
    },
    {
      particle: "F",
      charge: [0, -1],
    },
    {
      particle: "Na",
      charge: [0, 1],
    },
    {
      particle: "Mg",
      charge: [0, 2],
    },
    {
      particle: "Al",
      charge: [0, 3],
    },
    {
      particle: "Si",
      charge: [0, 4, -4],
    },
    {
      particle: "P",
      charge: [0, 5, 3, -3],
    },
    {
      particle: "S",
      charge: [0, 6, 4, 2, -2],
    },
    {
      particle: "Cl",
      charge: [0, 7, 5, 3, 1, -1],
    },
    {
      particle: "K",
      charge: [0, 1],
    },
    {
      particle: "Ca",
      charge: [0, 2],
    },
    {
      particle: "Sc",
      charge: [0, 3],
    },
    {
      particle: "Ti",
      charge: [0, 4, 3],
    },
    {
      particle: "V",
      charge: [0, 5, 4, 3, 2, 0],
    },
    {
      particle: "Cr",
      charge: [0, 6, 3, 2, 0],
    },
    {
      particle: "Mn",
      charge: [0, 7, 6, 4, 3, 2, 0, -1],
    },
    {
      particle: "Fe",
      charge: [0, 6, 3, 2, 0, -2],
    },
    {
      particle: "Co",
      charge: [0, 3, 2, 0, -1],
    },
    {
      particle: "Ni",
      charge: [0, 3, 2, 0],
    },
    {
      particle: "Cu",
      charge: [0, 2, 1],
    },
    {
      particle: "Zn",
      charge: [0, 2],
    },
    {
      particle: "Ga",
      charge: [0, 3],
    },
    {
      particle: "Ge",
      charge: [0, 4],
    },
    {
      particle: "As",
      charge: [0, 5, 3, -2],
    },
    {
      particle: "Se",
      charge: [0, 6, 4, -2],
    },
    {
      particle: "Br",
      charge: [0, 7, 5, 3, 1, -1],
    },
    {
      particle: "Kr",
      charge: [0, 2],
    },
    {
      particle: "Rb",
      charge: [0, 1],
    },
    {
      particle: "Sr",
      charge: [0, 2],
    },
    {
      particle: "Y",
      charge: [0, 3],
    },
    {
      particle: "Zr",
      charge: [0, 4],
    },
    {
      particle: "Nb",
      charge: [0, 5, 3],
    },
    {
      particle: "Mo",
      charge: [0, 6, 5, 4, 3, 2, 0],
    },
    {
      particle: "Tc",
      charge: [0, 7],
    },
    {
      particle: "Ru",
      charge: [0, 8, 6, 4, 3, 2, 0, -2],
    },
    {
      particle: "Rh",
      charge: [0, 5, 4, 3, 2, 1, 0],
    },
    {
      particle: "Pd",
      charge: [0, 4, 2, 0],
    },
    {
      particle: "Ag",
      charge: [0, 2, 1],
    },
    {
      particle: "Cd",
      charge: [0, 2],
    },
    {
      particle: "In",
      charge: [0, 3],
    },
    {
      particle: "Sn",
      charge: [0, 4, 2],
    },
    {
      particle: "Sb",
      charge: [0, 5, 3, -2],
    },
    {
      particle: "Te",
      charge: [0, 6, 4, 2],
    },
    {
      particle: "I",
      charge: [0, 7, 5, 1, -1],
    },
    {
      particle: "Xe",
      charge: [0, 7],
    },
    {
      particle: "Cs",
      charge: [0, 1],
    },
    {
      particle: "Ba",
      charge: [0, 2],
    },
    {
      particle: "La",
      charge: [0, 3],
    },
    {
      particle: "Ce",
      charge: [0, 4, 3],
    },
    {
      particle: "Pr",
      charge: [0, 4, 3],
    },
    {
      particle: "Nd",
      charge: [0, 3],
    },
    {
      particle: "Pm",
      charge: [0, 3],
    },
    {
      particle: "Sm",
      charge: [0, 3, 2],
    },
    {
      particle: "Eu",
      charge: [0, 3, 2],
    },
    {
      particle: "Gd",
      charge: [0, 3],
    },
    {
      particle: "Tb",
      charge: [0, 4, 3],
    },
    {
      particle: "Dy",
      charge: [0, 3],
    },
    {
      particle: "Ho",
      charge: [0, 3],
    },
    {
      particle: "Er",
      charge: [0, 3],
    },
    {
      particle: "Tm",
      charge: [0, 3, 2],
    },
    {
      particle: "Yb",
      charge: [0, 3, 2],
    },
    {
      particle: "Lu",
      charge: [0, 3],
    },
    {
      particle: "Hf",
      charge: [0, 4],
    },
    {
      particle: "Ta",
      charge: [0, 5],
    },
    {
      particle: "W",
      charge: [0, 6, 5, 4, 3, 2, 0],
    },
    {
      particle: "Re",
      charge: [0, 5, 4, 3, 2, -1],
    },
    {
      particle: "Os",
      charge: [0, 8, 6, 4, 3, 2, 0, -2],
    },
    {
      particle: "Ir",
      charge: [0, 6, 4, 3, 2, 1, 0, -1],
    },
    {
      particle: "Pt",
      charge: [0, 4, 2, 0],
    },
    {
      particle: "Au",
      charge: [0, 3, 1],
    },
    {
      particle: "Hg",
      charge: [0, 2, 1],
    },
    {
      particle: "Tl",
      charge: [0, 3, 1],
    },
    {
      particle: "Pb",
      charge: [0, 4, 2],
    },
    {
      particle: "Bi",
      charge: [0, 5, 3],
    },
    {
      particle: "Po",
      charge: [0, 6, 4, 2],
    },
    {
      particle: "At",
      charge: [0, 7, 5, 3, 1, -1],
    },
    {
      particle: "Fr",
      charge: [0, 2],
    },
    {
      particle: "Ra",
      charge: [0, 2],
    },
    {
      particle: "Ac",
      charge: [0, 3],
    },
    {
      particle: "Th",
      charge: [0, 4],
    },
    {
      particle: "Pa",
      charge: [0, 5, 4],
    },
    {
      particle: "U",
      charge: [0, 6, 5, 4, 3],
    },
    {
      particle: "Np",
      charge: [0, 6, 5, 4, 3],
    },
    {
      particle: "Pu",
      charge: [0, 6, 5, 4, 3],
    },
    {
      particle: "Am",
      charge: [0, 6, 5, 4, 3],
    },
    {
      particle: "Cm",
      charge: [0, 4, 3],
    },
    {
      particle: "Bk",
      charge: [0, 4, 3],
    },
    {
      particle: "Cf",
      charge: [0, 4, 3],
    },
    {
      particle: "Es",
      charge: [0, 3],
    },
    {
      particle: "Fm",
      charge: [0, 3],
    },
    {
      particle: "Md",
      charge: [0, 3],
    },
    {
      particle: "No",
      charge: [0, 3],
    },
    {
      particle: "Lr",
      charge: [0, 3],
    },
  ],
  selected: { e: { charge: [-1] } },
};

export const HomonuclearDiatomVibrational = Template.bind({});
HomonuclearDiatomVibrational.args = {
  choices: [
    {
      particle: "N2",
      charge: [-2, -1, 0, 1, 2],
      electronic: [
        {
          type: "HomonuclearDiatom",
          e: ["X", "A", "W"],
          Lambda: [0, 1, 2],
          S: [0, 1],
          parity: ["g", "u"],
          reflection: ["+", "-"],
          vibrational: [
            {
              v: [1, 2, 3, 4, 5],
            },
            {
              v: [42],
            },
          ],
        },
      ],
    },
    {
      particle: "Ar",
      charge: [1],
    },
  ],
  selected: {
    N2: {
      charge: [0],
      electronic: [
        {
          type: "HomonuclearDiatom",
          e: ["X"],
          Lambda: [],
          S: [],
          parity: ["g"],
          reflection: [],
          vibrational: [],
        },
      ],
    },
  },
};

export const AtomLSTerm = Template.bind({});
AtomLSTerm.args = {
  choices: [
    {
      particle: "Rb",
      charge: [0],
      electronic: [
        {
          type: "AtomLS",
          term: {
            L: [0],
            S: [0],
            P: [1],
            J: [0],
          },
        },
      ],
    },
  ],
  selected: {
    Rb: {
      charge: [],
      electronic: [
        {
          type: "AtomLS",
          term: {
            L: [0],
            S: [],
            P: [1],
            J: [],
          },
        },
      ],
    },
  },
};
