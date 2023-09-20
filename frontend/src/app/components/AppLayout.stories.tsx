import {Meta, StoryObj} from "@storybook/react";
import {AppLayout} from "./AppLayout";

const meta: Meta<typeof AppLayout> = {
  title: 'AppLayout/AppLayout',
  component: AppLayout,
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof AppLayout>;

export const Shown: Story = {
};