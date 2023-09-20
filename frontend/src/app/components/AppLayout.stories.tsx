import {Meta, StoryObj} from "@storybook/react";
import {AppLayout} from "./AppLayout";
import {AppLayoutProvider} from "../AppLayoutProvider";

const meta: Meta<typeof AppLayout> = {
  title: 'AppLayout/AppLayout',
  component: AppLayout,
  tags: ['autodocs'],
  argTypes: {},
  decorators: [(Story) => <AppLayoutProvider><Story /></AppLayoutProvider>] // Wrap stories in the provider

};

export default meta;

type Story = StoryObj<typeof AppLayout>;

export const Shown: Story = {
  args: { },
};