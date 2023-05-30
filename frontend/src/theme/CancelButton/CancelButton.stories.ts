import type {Meta, StoryObj} from '@storybook/react';

import CancelButton from './CancelButton';

const meta: Meta<typeof CancelButton> = {
  title: 'Components/CancelButton',
  component: CancelButton,
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof CancelButton>;

export const Shown: Story = {
  args: { },
};