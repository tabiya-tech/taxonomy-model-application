import type {Meta, StoryObj} from '@storybook/react';

import ImportModelDialog from './ImportModelDialog';

const meta: Meta<typeof ImportModelDialog> = {
  title: 'Import/ImportModelDialog',
  component: ImportModelDialog,
  tags: ['autodocs'],
  argTypes: {notifyOnClose: {action: 'notifyOnClose'}},
};

export default meta;
type Story = StoryObj<typeof ImportModelDialog>;

export const Shown: Story = {
  args: {isOpen: true},
};
