import type {Meta, StoryObj} from '@storybook/react';

import {AlertWithDetails} from './AlertWithDetails';

const meta: Meta<typeof AlertWithDetails> = {
  title: 'Components/AlertWithDetails',
  component: AlertWithDetails,
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof AlertWithDetails>;

export const Shown: Story = {
  args: { },
};