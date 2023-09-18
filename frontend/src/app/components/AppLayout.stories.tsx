import { Meta, StoryObj } from '@storybook/react';
import { AppLayout } from './AppLayout';

const meta: Meta<typeof AppLayout> = {
  title: 'Application/AppLayout',
  component: AppLayout,
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof AppLayout>;

export const Shown: Story = {
  args: {
    children: (
      <div
        style={{
          backgroundColor: '#fff',
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        Content
      </div>
    ),
  },
};
