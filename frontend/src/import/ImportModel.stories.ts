import type { Meta, StoryObj } from '@storybook/react';

import ImportModel from './ImportModel';

const meta: Meta<typeof ImportModel> = {
  title: 'Import/ImportDialog',
  component: ImportModel,
  tags: ['autodocs'],
  argTypes: {
  },
};

export default meta;
type Story = StoryObj<typeof ImportModel>;

export const Shown: Story = {
  args: {
  },
};