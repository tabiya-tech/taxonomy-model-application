import type {Meta, StoryObj} from '@storybook/react';
import {ModelNameField} from './ModelNameField';

const meta: Meta<typeof ModelNameField> = {
  title: 'Import/ModelNameField',
  component: ModelNameField,
  tags: ['autodocs'],
  argTypes: {notifyModelNameChanged: {action: 'notifyModelNameChanged'}},
};

export default meta;
type Story = StoryObj<typeof ModelNameField>;

export const ComponentRendered: Story = {
  args: {
  },
};