import { EditForm } from "./EditForm";
import { ComponentStory, ComponentMeta } from "@storybook/react";

const meta = {
    component: EditForm,
    argTypes: { onSubmit: { action: "submitted" } },
  } as ComponentMeta<typeof EditForm>;

  export default meta;

const Template: ComponentStory<typeof EditForm> = (args) => (
  <EditForm {...args} />
);

export const Minimal = Template.bind({})
Minimal.args = {
    set: {
        name: 'Some set name',
        description: 'Some set description',
        complete: false,
        contributor: 'Some organization',
        processes: [],
        states: {},
        references: {}
    },
    setKey: '1234',
    commitMessage: '',
    organizations: [{_key: '1', name: 'Some organization'}, {_key: '2', name: 'Some other organization'}]
}