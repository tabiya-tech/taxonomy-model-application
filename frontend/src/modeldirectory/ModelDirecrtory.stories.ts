import type {Meta, StoryObj} from '@storybook/react';

import ModelDirectory from './ModelDirectory';

const meta: Meta<typeof ModelDirectory> = {
  title: 'ModelDirectory/ModelDirectory',
  component: ModelDirectory,
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof ModelDirectory>;

export const Shown: Story = {
  args: {},
};