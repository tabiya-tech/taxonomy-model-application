import { Meta, StoryObj } from '@storybook/react';
import { AppLayout } from './AppLayout';
import {Box} from "@mui/material";

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
      <Box
        sx={{
          backgroundColor: 'containerBackground.light',
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        Content
      </Box>
    ),
  },
};
