import { EditForm } from "./EditForm";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { ReactionTypeTag, Storage } from "@lxcat/schema/dist/core/enumeration";
import { InState } from "@lxcat/schema/dist/core/state";
import { AtomLS as AtomLSState } from "@lxcat/schema/dist/core/atoms/ls";
import { CouplingScheme } from "@lxcat/schema/dist/core/atoms/coupling_scheme";

const meta = {
  component: EditForm,
  argTypes: { onSubmit: { action: "submitted" } },
} as ComponentMeta<typeof EditForm>;

export default meta;

const Template: ComponentStory<typeof EditForm> = (args) => (
  <EditForm {...args} />
);

export const Minimal = Template.bind({});
Minimal.args = {
  set: {
    name: "Some set name",
    description: "Some set description",
    complete: false,
    contributor: "Some organization",
    processes: [],
    states: {},
    references: {},
  },
  setKey: "1234",
  commitMessage: "",
  organizations: [
    { _key: "1", name: "Some organization" },
    { _key: "2", name: "Some other organization" },
  ],
};

export const Single = Template.bind({});
Single.args = {
  set: {
    name: "Some set name",
    description: "Some set description",
    complete: false,
    contributor: "Some organization",
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
  setKey: "1234",
  commitMessage: "",
  organizations: [
    { _key: "1", name: "Some organization" },
    { _key: "2", name: "Some other organization" },
  ],
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
    name: "Some set name",
    description: "Some set description",
    complete: false,
    contributor: "Some organization",
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
        reference: ["ref1"],
      },
    ],
    states: {
      Ar: state4AtomLSGround,
    },
    references: {
      ref1: {
        id: "ref1",
        type: "article",
        title: "First article",
      },
    },
  },
  setKey: "1234",
  commitMessage: "",
  organizations: [
    { _key: "1", name: "Some organization" },
    { _key: "2", name: "Some other organization" },
  ],
};

export const AtomLSGExited = Template.bind({});
const state4AtomLSGExited: InState<AtomLSState> = {
  particle: "Ukn",
  charge: 5,
  type: "AtomLS",
  electronic: [{ e: "*" }],
};
AtomLSGExited.args = {
  set: {
    name: "Some set name",
    description: "Some set description",
    complete: false,
    contributor: "Some organization",
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
        reference: ["ref1"],
      },
    ],
    states: {
      Ar: state4AtomLSGExited,
    },
    references: {
      ref1: {
        id: "ref1",
        type: "article",
        title: "First article",
      },
    },
  },
  setKey: "1234",
  commitMessage: "",
  organizations: [
    { _key: "1", name: "Some organization" },
    { _key: "2", name: "Some other organization" },
  ],
};
