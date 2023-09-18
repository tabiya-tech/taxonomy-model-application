import {Meta, StoryObj} from "@storybook/react";
import AppSidebar from "./AppSidebar";

const meta: Meta<typeof AppSidebar> = {
  title: 'Application/AppSidebar',
  component: AppSidebar,
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof AppSidebar>;

export const Shown: Story = {
  args: { },
};