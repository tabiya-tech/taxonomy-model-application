import type {Meta, StoryObj} from '@storybook/react';

import Info from "./Info";

const meta: Meta<typeof Info> = {
  title: 'Application/Info',
  component: Info,
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Info>;

export const Shown: Story = {
  args: {},
};