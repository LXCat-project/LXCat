import { CouplingScheme } from "@lxcat/schema/dist/core/atoms/coupling_scheme";
import { AtomLS as AtomLSState } from "@lxcat/schema/dist/core/atoms/ls";
import { AtomJ1L2 as AtomJ1L2State } from "@lxcat/schema/dist/core/atoms/j1l2";
import { ReactionTypeTag, Storage } from "@lxcat/schema/dist/core/enumeration";
import { HeteronuclearDiatom as HeteronuclearDiatomState } from "@lxcat/schema/dist/core/molecules/diatom_heteronuclear";
import { HomonuclearDiatom as HomonuclearDiatomState } from "@lxcat/schema/dist/core/molecules/diatom_homonuclear";
import { LinearTriatomInversionCenter as LinearTriatomInversionCenterState } from "@lxcat/schema/dist/core/molecules/triatom_linear_inversion_center";
import { InState } from "@lxcat/schema/dist/core/state";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import { EditForm } from "./EditForm";
import { CrossSectionSetRaw } from "@lxcat/schema/dist/css/input";

const meta = {
  component: EditForm,
  argTypes: { onSubmit: { action: "submitted" } },
} as ComponentMeta<typeof EditForm>;

export default meta;

const Template: ComponentStory<typeof EditForm> = (args) => (
  <EditForm {...args} />
);

const setTemplate: CrossSectionSetRaw = {
  name: "Some set name",
  description: "Some set description",
  complete: false,
  contributor: "Some organization",
  processes: [],
  states: {},
  references: {},
}
const organizations = [
  { _key: "1", name: "Some organization" },
  { _key: "2", name: "Some other organization" },
]

export const Minimal = Template.bind({});
Minimal.args = {
  set: {
    ...setTemplate
  },
  commitMessage: "",
  organizations
};

export const Single = Template.bind({});
Single.args = {
  set: {
    ...setTemplate,
    processes: [
      {
        reaction: {
          lhs: [{ count: 1, state: "e" }],
          rhs: [],
          reversible: false,
          type_tags: [ReactionTypeTag.Ionization],
        },
        threshold: 42,
        type: Storage.LUT,
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        data: [[1, 3.14e-20]],
        reference: ["ref1"],
      },
    ],
    states: {
      e: {
        particle: "e",
        charge: -1,
      },
    },
    references: {
      ref1: {
        id: "ref1",
        type: "article",
        title: "First article",
      },
    },
  },
  commitMessage: "",
  organizations
};

export const AtomLSGround = Template.bind({});
const state4AtomLSGround: InState<AtomLSState> = {
  particle: "Ukn",
  charge: 5,
  type: "AtomLS",
  electronic: [
    {
      scheme: CouplingScheme.LS,
      config: [],
      term: {
        L: 3,
        S: 2,
        P: 1,
        J: 4,
      },
    },
  ],
};
AtomLSGround.args = {
  set: {
    ...setTemplate,
    processes: [
      {
        reaction: {
          lhs: [{ count: 1, state: "Ar" }],
          rhs: [],
          reversible: false,
          type_tags: [ReactionTypeTag.Ionization],
        },
        threshold: 42,
        type: Storage.LUT,
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        data: [[1, 3.14e-20]],
        reference: [],
      },
    ],
    states: {
      Ukn: state4AtomLSGround,
    },
  },
  commitMessage: "",
  organizations
};

export const AtomLSExcited = Template.bind({});
const state4AtomLSExcited: InState<AtomLSState> = {
  particle: "Ukn",
  charge: 5,
  type: "AtomLS",
  electronic: [
    {
      e: "*",
    },
  ],
};
AtomLSExcited.args = {
  set: {
    ...setTemplate,
    processes: [
      {
        reaction: {
          lhs: [{ count: 1, state: "Ar" }],
          rhs: [],
          reversible: false,
          type_tags: [ReactionTypeTag.Ionization],
        },
        threshold: 42,
        type: Storage.LUT,
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        data: [[1, 3.14e-20]],
        reference: [],
      },
    ],
    states: {
      Ukn: state4AtomLSExcited,
    },
    
  },
  commitMessage: "",
  organizations
};

export const LinearTriatomInversionCenter = Template.bind({});
const state4LinearTriatomInversionCenter: InState<LinearTriatomInversionCenterState> =
  {
    particle: "CO2",
    charge: 0,
    type: "LinearTriatomInversionCenter",
    electronic: [
      {
        e: "X",
        Lambda: 0,
        S: 0,
        parity: "g",
        reflection: "+",
        vibrational: [{ v: [0, 0, 0] }],
      },
    ],
  };
LinearTriatomInversionCenter.args = {
  set: {
    ...setTemplate,
    processes: [
      {
        reaction: {
          lhs: [{ count: 1, state: "CO2" }],
          rhs: [],
          reversible: false,
          type_tags: [ReactionTypeTag.Ionization],
        },
        threshold: 42,
        type: Storage.LUT,
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        data: [[1, 3.14e-20]],
        reference: [],
      },
    ],
    states: {
      CO2: state4LinearTriatomInversionCenter,
    },
  },
  commitMessage: "",
  organizations
};

export const HeteronuclearDiatom = Template.bind({});
const state4HeteronuclearDiatom: InState<HeteronuclearDiatomState> = {
  particle: "CO",
  charge: 0,
  type: "HeteronuclearDiatom",
  electronic: [
    {
      e: "X",
      Lambda: 0,
      S: 0,
      reflection: "+",
    },
  ],
};
HeteronuclearDiatom.args = {
  set: {
    ...setTemplate,
    processes: [
      {
        reaction: {
          lhs: [{ count: 1, state: "CO" }],
          rhs: [],
          reversible: false,
          type_tags: [ReactionTypeTag.Ionization],
        },
        threshold: 42,
        type: Storage.LUT,
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        data: [[1, 3.14e-20]],
        reference: [],
      },
    ],
    states: {
      CO: state4HeteronuclearDiatom,
    },
  },
  commitMessage: "",
  organizations
};

export const HomonuclearDiatomNoVibNoRot = Template.bind({});
const state4HomonuclearDiatomNoVibNoRot: InState<HomonuclearDiatomState> = {
  particle: "N2",
  charge: 0,
  type: "HomonuclearDiatom",
  electronic: [
    {
      e: "X",
      Lambda: 0,
      S: 0,
      parity: "g",
      reflection: "+",
    },
  ],
};
HomonuclearDiatomNoVibNoRot.args = {
  set: {
    ...setTemplate,
    processes: [
      {
        reaction: {
          lhs: [{ count: 1, state: "N2" }],
          rhs: [],
          reversible: false,
          type_tags: [ReactionTypeTag.Ionization],
        },
        threshold: 42,
        type: Storage.LUT,
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        data: [[1, 3.14e-20]],
        reference: [],
      },
    ],
    states: {
      N2: state4HomonuclearDiatomNoVibNoRot,
    },
  },
  commitMessage: "",
  organizations
};

export const HomonuclearDiatomWithRot = Template.bind({});
const state4HomonuclearDiatomWithRot: InState<HomonuclearDiatomState> = {
  particle: "N2",
  charge: 0,
  type: "HomonuclearDiatom",
  electronic: [
    {
      e: "X",
      Lambda: 0,
      S: 0,
      parity: "g",
      reflection: "+",
      vibrational: [{ v: 0, rotational: [{ J: 2 }] }],
    },
  ],
};
HomonuclearDiatomWithRot.args = {
  set: {
    ...setTemplate,
    processes: [
      {
        reaction: {
          lhs: [{ count: 1, state: "N2" }],
          rhs: [],
          reversible: false,
          type_tags: [ReactionTypeTag.Ionization],
        },
        threshold: 42,
        type: Storage.LUT,
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        data: [[1, 3.14e-20]],
        reference: [],
      },
    ],
    states: {
      N2: state4HomonuclearDiatomWithRot,
    },
  },
  commitMessage: "",
  organizations
};

export const HomonuclearDiatomWithMultiVib = Template.bind({});
const state4HomonuclearDiatomWithMultiVib: InState<HomonuclearDiatomState> = {
  particle: "N2",
  charge: 0,
  type: "HomonuclearDiatom",
  electronic: [
    {
      e: "X",
      Lambda: 0,
      S: 0,
      parity: "g",
      reflection: "+",
      vibrational: [{ v: 9 }, { v: 10 }],
    },
  ],
};
HomonuclearDiatomWithMultiVib.args = {
  set: {
    ...setTemplate,
    processes: [
      {
        reaction: {
          lhs: [{ count: 1, state: "N2" }],
          rhs: [],
          reversible: false,
          type_tags: [ReactionTypeTag.Ionization],
        },
        threshold: 42,
        type: Storage.LUT,
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        data: [[1, 3.14e-20]],
        reference: [],
      },
    ],
    states: {
      N2: state4HomonuclearDiatomWithMultiVib,
    },
  },
  commitMessage: "",
  organizations
};

export const AtomJ1L2 = Template.bind({});
const state4AtomJ1L2: InState<AtomJ1L2State> = {
  particle: "Ukn",
  charge: 5,
  type: "AtomJ1L2",
  electronic: [
    {
      scheme: CouplingScheme.J1L2,
      config: {
        core: {
          scheme: CouplingScheme.LS,
          config: [{ n: 2, l: 2, occupance: 6 }],
          term: { S: 0.5, L: 1, P: -1, J: 1.5 },
        },
        excited: {
          scheme: CouplingScheme.LS,
          config: [{ n: 4, l: 3, occupance: 1 }],
          term: { S: 1.5, L: 2, P: 1 },
        },
      },
      term: {
        K: 0.5,
        S: 1.5,
        P: -1,
        J: 4,
      },
    },
  ],
};
AtomJ1L2.args = {
  set: {
    ...setTemplate,
    processes: [
      {
        reaction: {
          lhs: [{ count: 1, state: "Ar" }],
          rhs: [],
          reversible: false,
          type_tags: [ReactionTypeTag.Ionization],
        },
        threshold: 42,
        type: Storage.LUT,
        labels: ["Energy", "Cross Section"],
        units: ["eV", "m^2"],
        data: [[1, 3.14e-20]],
        reference: [],
      },
    ],
    states: {
      Ukn: state4AtomJ1L2,
    },
  },
  commitMessage: "",
  organizations
};
