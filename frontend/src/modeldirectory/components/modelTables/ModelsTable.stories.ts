import type {Meta, StoryObj} from '@storybook/react';

import ModelsTable from "./ModelsTable";
import {getArrayOfFakeModels, getArrayOfFakeModelsMaxLength} from "./_test_utilities/mockModelData";

const meta: Meta<typeof ModelsTable> = {
  title: 'ModelDirectory/ModelsTable',
  component: ModelsTable,
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof ModelsTable>;

export const Shown: Story = {
  args: {
    models: getArrayOfFakeModels(10),
    isLoading: false
  },
};

export const ShownWithLongData: Story = {
  args: {
    models: getArrayOfFakeModelsMaxLength(10),
    isLoading: false
  },
};

export const ShownInLoadingState: Story = {
  args: {
    models: [],
    isLoading: true
  },
};